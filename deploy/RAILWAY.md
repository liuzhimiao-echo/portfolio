# 部署到 Railway（生成公网网址）

目标：把作品集 + 留言服务托管到 Railway，得到一个任何人都能访问的公网网址，访客留言实时转发到你的 QQ 邮箱，你用私密收件箱查看。

## 为什么这样配
- **前端留言用相对路径 `/api/msg`**，没有写死 localhost，部署到任何域名都正常。
- **端口读 `process.env.PORT`**，Railway 会自动注入，本地回退 3000。
- **敏感信息走环境变量，不进代码仓库**：`msg-config.json` 已被 `.gitignore` 忽略，`server.js` 优先读 Railway Variables（EMAIL_TO / EMAIL_PASS / MSG_SECRET 等）。这样你的邮箱授权码和收件箱密钥不会泄露在 GitHub 上。

> 注意：留言文件 `messages.json` 在 Railway 上默认是临时文件系统，重启/重新部署会清空。但**留言已实时转发到你 QQ 邮箱**（主备份），收件箱网页只是查看入口，所以不影响"反馈到我这边"。若想让收件箱历史也持久化，见文末「持久化留言」。

## 步骤

### 1. 准备一个 GitHub 账号
Railway 最顺的方式是连 GitHub 自动部署。没有账号先注册一个（免费）。

### 2. 在 GitHub 新建空仓库
- 点右上角 `+` → New repository
- 名字随便（如 `portfolio`）
- **不要**勾选 Add a README / .gitignore（保持空仓库）
- 创建后，复制仓库的 HTTPS 地址（形如 `https://github.com/你的用户名/portfolio.git`）

### 3. 本地把代码推上去
在本机这个目录下执行（把 URL 换成你自己的）：
```bash
git init
git add .
git commit -m "portfolio + message service"
git branch -M main
git remote add origin https://github.com/你的用户名/portfolio.git
git push -u origin main
```
> 推之前确认 `msg-config.json`、`messages.json`、`node_modules` 没有被提交（已被 .gitignore 拦住）。可用 `git status` 检查。

（如果你不想自己敲命令，可以把 GitHub 私人访问令牌 token 发我，我帮你建仓库并推送。）

### 4. 在 Railway 部署
1. 打开 https://railway.app ，用 **GitHub 登录**
2. New Project → **Deploy from GitHub repo** → 选刚才的仓库
3. Railway 会自动 `npm install` + `npm start`，稍等几十秒
4. 部署完成后，点项目里的 **Settings → Generate Domain**（或 Deployments 里能看到网址），得到一个 `https://xxx.up.railway.app` 的公网网址

### 5. 在 Railway 后台填「环境变量」（关键！）
进入项目 **Variables**，逐条添加（Add Variable）：

| 变量名 | 值 | 说明 |
|---|---|---|
| `EMAIL_ENABLED` | `true` | 开启邮件转发 |
| `EMAIL_PROVIDER` | `qq` | QQ 邮箱 |
| `EMAIL_TO` | `3132938961@qq.com` | 收件邮箱 |
| `EMAIL_USER` | `3132938961@qq.com` | 发件登录账号（同 QQ 邮箱） |
| `EMAIL_PASS` | `你的QQ授权码` | **授权码不是密码**（之前生成的那串，如 `vlkfrayveavldddg`） |
| `EMAIL_FROM` | `Portfolio Messages <3132938961@qq.com>` | 可选 |
| `MSG_SECRET` | `自己起一串随机字符串` | 收件箱密钥，**务必固定**，否则每次部署收件箱地址会变 |

添加后 Railway 会自动重新部署。

### 6. 验证
1. 打开你的 Railway 网址 `https://xxx.up.railway.app/`，应看到作品集首页
2. 点右下角 **Leave a message** → 留一条测试留言 → 发送
3. 查 QQ 邮箱，应收到「【作品集新留言】…」邮件
4. 打开收件箱：`https://xxx.up.railway.app/inbox?key=你设的MSG_SECRET`，应能看到刚才的留言（实时出现）

## 持久化留言（可选）
若希望 `messages.json` 的历史在重启后不丢：
1. Railway 项目里 **Settings → Volumes → Add Volume**，挂载路径填 `/data`
2. 再在 Variables 加一条：`DATA_DIR` = `/data`
3. 重新部署，留言会写到 `/data/messages.json`，重启后保留

## 日常维护
- 改了 `index.html` 等代码 → 重新 `git push`，Railway 自动重新部署
- 服务 24 小时在线，你电脑关着也没事
- 收件箱网址（`/inbox?key=`）只你自己知道，访客打不开
