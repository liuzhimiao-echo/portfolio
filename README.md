# 个人作品集单页网站 · 使用说明

零构建、单文件、可直接打开。技术栈：原生 HTML / CSS / JS（无任何框架依赖，加载极快）。

## 文件结构
```
index.html      ← 网站全部内容（结构 + 样式 + 交互，已内嵌）
README.md       ← 本说明
```
> 如需工程化，可把 `<style>` 抽到 `styles.css`、`<script>` 抽到 `script.js`，并改用 Next.js + Tailwind + GSAP，逻辑一一对应。

## 如何运行
- **最简单**：双击 `index.html` 用浏览器打开即可。
- **推荐（避免字体/CDN 跨域问题）**：在目录下起一个本地服务
  ```bash
  # 任选其一
  python3 -m http.server 5173
  npx serve .
  ```
  然后访问 `http://localhost:5173`。

## 已实现的需求清单
1. 自定义光标 + 蓝白渐变光晕（移动端自动禁用）
2. Hero 超大标题：蓝粉渐变 + 逐字入场动画
3. 滚动触发区块动画（淡入上移，IntersectionObserver）
4. Bento Grid 作品集卡片（hover 缩放 + 光晕，含大小错落）
5. 平滑锚点导航 + 滚动高亮（scrollspy）
6. 暗 / 亮主题切换，偏好记忆到 `localStorage`
- 响应式（桌面 / 平板 / 手机三档断点）
- 可访问性：skip-link、语义标签、`aria-label`、`focus-visible`、尊重 `prefers-reduced-motion`
- 性能：无外部 JS 依赖，仅一个字体 CDN，离线时自动回退系统字体

## 你需要替换的占位内容
- 姓名 / 品牌：`ALEX CHEN`（`#heroTitle` 的 `data-text` 与文案）
- 简介文案：`#about`、`.hero-sub`
- 项目卡片：`#work` 下 6 个 `.card`（标题 / 描述 / 分类）
- 邮箱与社媒：`#contact` 内的 `mailto:` 与链接
- 配色：`:root` 中 `--blue / --pink / --grad` 等变量，改一处全局生效

## 可扩展方向
- 接入真实作品图（替换 `.card::before` 渐变为 `background-image`）
- 加 Spline / three.js 的 3D 悬浮元素
- 拆为 Next.js 项目并接入 CMS（作品数据动态化）

---

## 访客留言功能（创建者专属收件箱）

访客通过页面右下角浮动的 **Leave a message** 玻璃按钮留言；留言**不会**出现在公开网页上，只传到创建者（你）这里。

### 运行留言服务（启用留言的必备步骤）
留言需要一个轻量 Node 服务来接收并转发。首次运行会自动生成私密密钥。

```bash
# 在本目录执行（nodemailer 已装在隔离工作区，用 NODE_PATH 指向它）
NODE_PATH="C:/Users/7/.workbuddy/binaries/node/workspace/node_modules" node server.js
# 若已在本目录 npm install 过，则直接：node server.js
```

启动后：
- 公开网页：`http://localhost:3000/`
- 私密收件箱（仅你能看）：`http://localhost:3000/inbox?key=<自动生成的密钥>`
  - 把该地址存进浏览器书签；新留言会通过 SSE **实时推送**到这个页面，没人能看到。

### 让留言发到你邮箱（邮件转发）
编辑 `msg-config.json`：
1. `email.enabled` 改为 `true`
2. 填 `email.to`（你的收件邮箱）与 `email.smtp`（QQ / 163 / Gmail 的 SMTP 主机、端口、账号与**授权码**，非登录密码）
3. 重启服务。此后每条访客留言都会同时发到你邮箱。

> 不配邮箱也能用：留言会落地 `messages.json`，并实时出现在上面的私密收件箱。

### 数据与配置
- 留言落地 `messages.json`（同目录）：`{ id, name, text, ts, ip }`
- `msg-config.json` 保存端口、密钥、邮件配置；密钥首次运行自动生成，可手动改成你喜欢的字符串（改后记得同步收件箱地址）。
- 安全：收件箱与接口均需密钥；含每 IP 每分钟限流，防刷。
