# 立即部署清单 · Railway 全栈托管（竞情 Intelli 已并入作品集）

> 目标：把作品集网站 + 访客留言服务发布到公网，得到一个 `https://xxx.up.railway.app` 的稳定网址，
> 自动 HTTPS/SSL，24 小时在线（你电脑关机也不影响），访客留言实时转发到你的 QQ 邮箱。
>
> 本文件是「当前项目实际状态」下的一步到位清单。更详细的原理见 `deploy/RAILWAY.md`。

---

## 0. 当前状态（已由助手核对）

| 项 | 状态 |
|---|---|
| 代码仓库 | ✅ 已是 git 仓库，分支 `main` |
| GitHub 远程 | ✅ 已配置 `origin` → `https://github.com/liuzhimiao-echo/portfolio.git` |
| 待推送 commit | ⚠️ 本地领先远程 **7 个 commit**，且本轮新增改动**尚未提交**（见下） |
| 服务器环境 | ✅ `server.js` 端口读 `process.env.PORT`、静态托管 + 留言 API 均已本地验证通过 |
| 敏感信息 | ✅ `msg-config.json` / `messages.json` / `node_modules` 已被 `.gitignore` 拦截，不会上传 |
| 本轮新增文件 | `jingqing-intelli-prototype.html`（竞情 Intelli 可交互原型，已被网站项目02的 iframe 引用） |
| 本轮改动文件 | `index.html`（AI 项目栏第二个项目填充 + 原型展示区缩小 + 响应式适配） |

> 本地服务验证结果（助手在沙箱内实测）：首页 HTTP 200、原型文件 HTTP 200、`/api/msg` 路由正常接收并解析请求。
> （沙箱禁止写 `messages.json`，故本地写盘那步报 EPERM，这是**沙箱限制不是代码问题**，Railway 环境无此限制。）

---

## 1. 提交并推送本轮改动（用 GitHub Desktop，最省事）

你的 git 是随 **GitHub Desktop** 装的，直接用它最顺：

1. 打开 **GitHub Desktop**，左上角仓库选 `portfolio`。
2. 左侧「Changes」会看到本轮改动：`index.html`、`jingqing-intelli-prototype.html`（生活照 `images/life-*.jpg` 若不想传可先不勾）。
3. 底部填写提交信息，例如：
   `feat: 作品集加入竞情 Intelli 项目 + 原型展示区缩小与响应式适配`
4. 点 **Commit to main**。
5. 右上角点 **Push origin**（会把本地领先的全部 commit 一起推上去）。

> 如果你更习惯命令行（git 路径：`C:\Users\7\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe`）：
> ```powershell
> $git = "C:\Users\7\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"
> cd C:\Users\7\Desktop\portfolio
> & $git add index.html jingqing-intelli-prototype.html
> & $git commit -m "feat: 作品集加入竞情 Intelli 项目 + 原型展示区缩小与响应式适配"
> & $git push origin main
> ```

---

## 2. 在 Railway 部署（首次约 2 分钟）

1. 打开 <https://railway.app>，点 **Login → 用 GitHub 登录**（授权即可）。
2. **New Project → Deploy from GitHub repo → 选 `liuzhimiao-echo/portfolio`**。
   - 首次需在 GitHub 授权 Railway 访问该仓库（弹窗里点 Install / Configure）。
3. Railway 自动读 `railway.json`：`npm install` → `npm start`（即 `node server.js`），等几十秒。
4. 部署完成后：项目 → **Settings → Networking → Generate Domain**，得到公网网址
   `https://xxx.up.railway.app` —— 这就是外部用户能访问的稳定地址（自动 HTTPS）。

---

## 3. 配环境变量（让留言发到 QQ 邮箱，关键）

进入 Railway 项目 → **Variables**，逐条 Add：

| 变量名 | 值 | 说明 |
|---|---|---|
| `RESEND_API_KEY` | 你的 Resend API Key | 到 <https://resend.com> 注册免费领取（`server.js` 用 Resend HTTP API 发信，避开 Railway 屏蔽 SMTP） |
| `EMAIL_TO` | `3132938961@qq.com` | 收留言的邮箱 |
| `MSG_SECRET` | 自己起一串固定随机字符串 | 收件箱密钥，**务必固定**，否则每次部署 `/inbox` 地址会变 |

> 说明：`server.js` 现在走的是 **Resend HTTP API**（见代码注释），不是 QQ SMTP。
> 只要不填 `RESEND_API_KEY`，留言仍会实时进「私密收件箱」页面，只是不额外发邮件——不影响网站发布，可后补。
> 添加变量后 Railway 会自动重新部署。

---

## 4. 验证（部署后测试）

1. 打开 `https://xxx.up.railway.app/` → 应看到作品集首页，进入「AI 探索项目」→ 点**项目 02 竞情 Intelli** → 详情面板打开，右侧可交互原型能点。
2. 点右下角 **Leave a message** → 留一条测试 → 发送成功。
3. 打开 `https://xxx.up.railway.app/inbox?key=你设的MSG_SECRET` → 应实时看到刚才的留言。
4. 若配了 `RESEND_API_KEY` → 查 QQ 邮箱应收到「【作品集新留言】…」。

### 性能 / 多网络环境测试建议
- **访问速度**：用手机 4G/5G（关 WiFi）打开网址，首屏应 1–2 秒内可见；Railway 默认在海外节点，国内访问略慢属正常，可后续接 Cloudflare CDN 加速。
- **响应性能**：Chrome DevTools → Lighthouse 跑一次，或 Network 面板看首页 ~70KB、原型 ~515KB（`loading` 时原型在详情面板内，首屏不加载，不拖慢首页）。
- **响应式**：DevTools 设备工具栏切 iPhone / iPad / 桌面三档，确认「AI 项目栏 → 项目02 详情」的原型区在窄屏堆叠为单列、界面完整（本地已验证 820px / 520px 断点正常）。

---

## 5. 日常维护
- 改了 `index.html` 等 → GitHub Desktop 里 Commit + Push，Railway 自动重新部署。
- 留言 `messages.json` 在 Railway 默认是临时盘，重启会清空；但留言已进收件箱/邮箱，不丢反馈。想持久化见 `deploy/RAILWAY.md` 文末「持久化留言」。

---

## 备选：自定义域名（可选，非必需）
Railway 免费给的 `xxx.up.railway.app` 已自带 HTTPS，够用。若想用自己的域名：
1. 买域名（阿里云 / Namecheap 等）。
2. Railway 项目 → Settings → Networking → **Custom Domain**，填你的域名。
3. 按 Railway 给的 CNAME 记录，去域名服务商后台加解析。
4. Railway 自动签发 SSL 证书，几分钟后 `https://你的域名` 生效。
