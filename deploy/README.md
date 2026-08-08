# 部署到云服务器指南

本目录的脚本/配置，配合项目根目录的 `server.js` / `index.html` / `images/` / `msg-config.json` / `package.json`，
可把你的作品集 + 留言服务部署到任意一台 Linux 云服务器，实现 **7×24 在线、任何人（招聘方/朋友）都能打开并留言、留言实时进你 QQ 邮箱**。

> 前端留言地址用的是相对路径，代码无需任何改动，直接搬上服务器即可运行。

---

## 一、买一台最便宜的云服务器
- 推荐：**腾讯云 / 阿里云「轻量应用服务器」**，1 核 2G 足够，系统选 **Ubuntu 22.04 LTS**（本脚本针对它）。
- 带宽 3–5 Mbps 够用（作品集是静态页 + 少量留言）。
- 月费通常 30–60 元，新人有首单优惠。
- 买完记下两样：**公网 IP**、登录用户名（轻量云默认 `ubuntu`，部分 `root`）。

## 二、开放防火墙端口（云厂商控制台「防火墙 / 安全组」）
- TCP `22`（SSH，默认开）
- 最简方案放行 **TCP `3000`**；若用 Nginx 域名方案放行 **TCP `80` / `443`**

## 三、把项目传到服务器
在本机（你的电脑）打开终端，进入项目目录后执行：

```bash
# 1) 打包（排除本地运行日志与依赖目录）
tar czf portfolio.tar.gz --exclude=server.log --exclude=node_modules \
    index.html images server.js msg-config.json package.json deploy

# 2) 上传（把 IP 和用户名换成你的）
scp portfolio.tar.gz ubuntu@你的服务器公网IP:~/

# 3) 登服务器、解包
ssh ubuntu@你的服务器公网IP
mkdir -p ~/portfolio && tar xzf portfolio.tar.gz -C ~/portfolio && cd ~/portfolio
```

## 四、一键安装并启动
在服务器上执行：

```bash
bash deploy/setup.sh
```

脚本会自动：安装 Node.js（若没有）→ `npm install` 装依赖 → 注册 systemd 服务（开机自启）→ 启动服务。

完成后访问 `http://你的服务器公网IP:3000/` 即可看到网站。

## 五、验证整条链路
1. 浏览器打开 `http://服务器IP:3000/`，点右下角 **Leave a message**，发一条测试留言。
2. 检查 QQ 邮箱是否收到「作品集新留言」邮件（标题含访客称呼与内容）。
3. 打开你的**私密收件箱** `http://服务器IP:3000/inbox?key=<secret>`（secret 见 `msg-config.json`），确认留言实时出现。

## 六、（推荐）域名 + HTTPS，地址更专业
若你有域名，按 `deploy/nginx.conf` 里的说明做反向代理：
- `sudo apt-get install -y nginx`，把 `nginx.conf` 的 `server` 块写入站点并启用；
- 免费证书：`sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d 你的域名`；
- 之后访客访问 `https://你的域名/`，收件箱 `https://你的域名/inbox?key=...`。
（Nginx 已配置关闭 SSE 缓冲，私密收件箱实时推送不受影响。）

## 七、日常维护
- 改文案/图片：本机改完，重新打包上传覆盖，执行 `sudo systemctl restart portfolio`。
- 看日志：`sudo journalctl -u portfolio -f`
- 启/停：`sudo systemctl start/stop portfolio`
- 改邮箱/换密钥：编辑 `msg-config.json` → `sudo systemctl restart portfolio`（换 `secret` 后收件箱地址同步变化）。

## 八、注意事项
- **QQ 邮箱新 IP 风控**：服务器首次用授权码给 QQ 发信，可能被临时拦截。测试收不到时，去 QQ 邮箱网页端确认「来信」或在邮箱设置里重发一次即可；之后正常。
- **密钥保密**：收件箱 `key` 是随机长串，只在你手里，URL 不要外泄（否则别人能看留言）。建议配合 HTTPS 使用，避免 key 明文经过网络。
- **服务器要一直开机**：关机会导致网站与留言暂时不可用（但已落库的历史留言不会丢）。
- **数据备份**：`messages.json` 存所有留言，迁移/重装前记得保留它。
