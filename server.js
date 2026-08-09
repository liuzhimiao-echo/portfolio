// server.js — 个人作品集本地托管 + 访客留言服务
// 职责：
//   1) 托管 index.html / images 等静态资源
//   2) POST /api/msg   接收访客留言 → 存入 messages.json + 邮件转发给创建者（仅创建者可见）
//   3) GET  /inbox?key=SECRET   创建者专属私密收件箱（实时 SSE）
// 运行： node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');
const os = require('os');

const ROOT = __dirname;
const CONFIG_PATH = path.join(ROOT, 'msg-config.json');
const MSG_DIR = process.env.DATA_DIR || ROOT;
const MSG_FILE = path.join(MSG_DIR, 'messages.json');

// ---------- 配置加载 ----------
function loadConfig() {
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch (e) { cfg = {}; }
  cfg.port = parseInt(process.env.PORT, 10) || cfg.port || 3000;
  cfg.secret = process.env.MSG_SECRET || cfg.secret || '';
  if (!cfg.secret) {
    cfg.secret = crypto.randomBytes(18).toString('hex');
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)); } catch (e) {}
    console.log('\n[config] 已自动生成私密收件箱密钥');
  }
  cfg.email = cfg.email || {};
  if (process.env.EMAIL_TO) {
    cfg.email.to = process.env.EMAIL_TO;
    if (process.env.EMAIL_FROM) cfg.email.from = process.env.EMAIL_FROM;
  }
  return cfg;
}
const CONFIG = loadConfig();

// ---------- 留言存储 ----------
function loadMessages() {
  try { return JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); }
  catch (e) { return []; }
}
let messages = loadMessages();
function saveMessages() {
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages, null, 2));
}

// ---------- 邮件转发（Resend HTTP API，HTTPS 443，避开 Railway 屏蔽 SMTP 出网） ----------
const RESEND_API = 'https://api.resend.com/emails';
function emailReady() {
  return !!process.env.RESEND_API_KEY && !!(CONFIG.email && CONFIG.email.to);
}
console.log(emailReady()
  ? '[email] Resend 已启用 → ' + CONFIG.email.to
  : '[email] Resend 未启用（缺 RESEND_API_KEY 或 EMAIL_TO），留言仅本地保存 + 私密收件箱可见。');

async function forwardByEmail(msg) {
  if (!emailReady()) return;
  const time = new Date(msg.ts).toLocaleString('zh-CN', { hour12: false });
  const name = msg.name || '（匿名）';
  const subject = `【作品集新留言】${name}`;
  const text =
    `时间：${time}\n` +
    `访客：${name}\n` +
    `IP：${msg.ip}\n` +
    `留言：\n${msg.text}\n`;
  try {
    const r = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio <onboarding@resend.dev>',
        to: [CONFIG.email.to],
        subject,
        text,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error('Resend HTTP ' + r.status + ' ' + err);
    }
    console.log('[email] 已转发新留言给', CONFIG.email.to);
  } catch (e) {
    console.error('[email] 发送失败（留言已本地保存）：', e.message);
  }
}

// ---------- SSE 客户端池 ----------
const sseClients = new Set();
function broadcast(msg) {
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch (e) { sseClients.delete(res); }
  }
}

// ---------- 简单限流（每 IP 每分钟最多 12 条） ----------
const hit = new Map();
function rateOK(ip) {
  const now = Date.now();
  const arr = (hit.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now); hit.set(ip, arr);
  return arr.length <= 12;
}

// ---------- 静态资源 ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-ico',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(filePath, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}

// ---------- 私密收件箱页面 ----------
function inboxHtml(key) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>私密收件箱 · 仅创建者可见</title>
<style>
  :root{--bg:#0e1016;--card:#171b24;--line:#2a2f3a;--text:#e8eef5;--dim:#8b93a3;--ice:#6ab0d6}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,"PingFang SC","Microsoft YaHei",Segoe UI,sans-serif;padding:28px 16px 60px}
  h1{font-size:20px;margin:0 0 4px}
  .sub{color:var(--dim);font-size:13px;margin-bottom:18px}
  .bar{display:flex;gap:10px;align-items:center;margin-bottom:18px;flex-wrap:wrap}
  .count{background:var(--ice);color:#06222e;font-weight:700;border-radius:100px;padding:4px 12px;font-size:13px}
  .btn{background:transparent;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:7px 14px;cursor:pointer;font-size:13px}
  .btn:hover{border-color:var(--ice)}
  .list{display:flex;flex-direction:column;gap:12px;max-width:760px}
  .item{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
  .meta{display:flex;justify-content:space-between;color:var(--dim);font-size:12px;margin-bottom:8px}
  .who{color:var(--ice);font-weight:600}
  .txt{white-space:pre-wrap;line-height:1.6;font-size:14.5px}
  .empty{color:var(--dim);font-size:14px;padding:30px 0}
  .new{animation:flash 1.2s ease}
  @keyframes flash{0%{box-shadow:0 0 0 2px var(--ice)}100%{box-shadow:none}}
</style></head><body>
  <h1>私密收件箱</h1>
  <div class="sub">仅创建者可见 · 访客留言实时送达此处，不会出现在公开网页上</div>
  <div class="bar"><span class="count" id="c">0</span> 条留言
    <button class="btn" id="copy">复制全部</button>
    <button class="btn" id="refresh">刷新</button>
  </div>
  <div class="list" id="list"><div class="empty">加载中…</div></div>
<script>
  const KEY='${key}';
  const list=document.getElementById('list'),c=document.getElementById('c');
  let messages=[];
  function esc(s){return (s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));}
  function render(arr,freshId){
    c.textContent=arr.length;
    if(!arr.length){list.innerHTML='<div class="empty">还没有留言</div>';return;}
    list.innerHTML=arr.slice().reverse().map(m=>{
      const t=new Date(m.ts).toLocaleString('zh-CN',{hour12:false});
      return '<div class="item'+(m.id===freshId?' new':'')+'"><div class="meta"><span class="who">'+esc(m.name||'匿名')+'</span><span>'+t+'</span></div><div class="txt">'+esc(m.text)+'</div></div>';
    }).join('');
  }
  async function load(){const r=await fetch('/api/messages?key='+KEY);if(r.ok){messages=await r.json();render(messages);}}
  load();
  const es=new EventSource('/api/stream?key='+KEY);
  es.onmessage=e=>{const m=JSON.parse(e.data);messages.push(m);render(messages,m.id);};
  document.getElementById('copy').onclick=async()=>{
    const r=await fetch('/api/messages?key='+KEY);const arr=await r.json();
    const txt=arr.slice().reverse().map(m=>'['+new Date(m.ts).toLocaleString('zh-CN',{hour12:false})+'] '+(m.name||'匿名')+':\\n'+m.text).join('\\n\\n');
    navigator.clipboard.writeText(txt).then(()=>alert('已复制 '+arr.length+' 条留言'));
  };
  document.getElementById('refresh').onclick=load;
</script>
</body></html>`;
}

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  const p = u.pathname;

  // 允许跨域（GitHub Pages 等静态前端可调用 /api/msg）；同时放行预检 OPTIONS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  if (p === '/api/msg' && req.method === 'POST') {
    let body = '';
    req.on('data', d => { body += d; if (body.length > 1e6) req.destroy(); });
    req.on('end', async () => {
      let data;
      try { data = JSON.parse(body); } catch (e) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, error: 'bad json' })); }
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
      if (!rateOK(ip)) { res.writeHead(429); return res.end(JSON.stringify({ ok: false, error: 'too many' })); }
      const text = (data.text || '').toString().trim().slice(0, 1000);
      const name = (data.name || '').toString().trim().slice(0, 40);
      if (!text) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, error: 'empty' })); }
      const msg = { id: crypto.randomBytes(6).toString('hex'), name, text, ts: Date.now(), ip: ip || 'unknown' };
      messages.push(msg); saveMessages(); broadcast(msg); forwardByEmail(msg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id: msg.id }));
    });
    return;
  }

  if (p === '/inbox') {
    if (u.query.key !== CONFIG.secret) { res.writeHead(403); return res.end('403 Forbidden — 密钥错误'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(inboxHtml(CONFIG.secret));
  }

  if (p === '/api/messages') {
    if (u.query.key !== CONFIG.secret) { res.writeHead(403); return res.end(JSON.stringify({ error: 'forbidden' })); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(messages));
  }

  if (p === '/api/stream') {
    if (u.query.key !== CONFIG.secret) { res.writeHead(403); return res.end('forbidden'); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.write('retry: 3000\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  serveStatic(req, res, p);
});

server.listen(CONFIG.port, '0.0.0.0', () => {
  console.log('\n✅ 作品集服务已启动');
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) ips.push(ni.address);
    }
  }
  console.log('   本机访问 : http://localhost:' + CONFIG.port + '/');
  if (ips.length) {
    console.log('   手机 / 同 WiFi 设备访问：');
    ips.forEach(ip => console.log('     → http://' + ip + ':' + CONFIG.port + '/'));
  } else {
    console.log('   （未检测到局域网 IP，手机需走公网部署）');
  }
  console.log('   私密收件箱 : http://localhost:' + CONFIG.port + '/inbox?key=' + CONFIG.secret + '\n');
});
