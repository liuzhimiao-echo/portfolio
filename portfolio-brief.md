# 个人作品集网站 · 设计指令（生成 Prompt）

> 这是一份可直接交给 AI / 前端开发的「设计说明书」。第 7 节的中 / 英文 Prompt 可直接复制使用。

## 1. 设计定位

- **风格三角**：大气（Editorial 杂志感）× 时尚（Fashion 前卫）× 简洁（Minimal）。
- **关键词**：黑白、冰蓝、艺术气息、强排版、交互、上下滚动叙事。
- **气质目标**：第一眼高级，细看有巧思，像一个「数字画廊 / 个人杂志」。

## 2. 色彩系统（黑白冰蓝· 含具体 HEX）

| 角色            | 色值                                | 用途                     |
| ------------- | --------------------------------- | ---------------------- |
| Ink Black     | `#0B0B0F`                         | 暗色模式主背景 / 文字           |
| Paper White   | `#F7F7FA`                         | 亮色模式主背景                |
| Electric Blue | `#1F4DFF`                         | 主强调色（链接 / 高亮 / 关键动效）   |
| Neon Pink     | `#FF3D8B`                         | 次强调色（CTA / hover / 点睛） |
| Soft Pink     | `#FFD0E0`                         | 浅色块 / 渐变过渡             |
| Muted Blue    | `#8AA1FF`                         | 辅助色 / 次级信息             |
| 灰阶            | `#1A1A1F #2A2A30 #6B6B73 #C9C9D0` | 层级 / 描边 / 次要文字         |

- **招牌渐变**：Electric Blue `#1F4DFF` → Neon Pink `#FF3D8B`（用于 hero 文字描边、按钮、分隔线、光标光晕）。
- **用法守则**：亮色模式白底黑字，蓝粉作小面积强调；暗色模式黑底白字，蓝粉发光。永远保持「黑白为主、蓝粉点睛」的克制度（约 70/20/10）。

## 3. 字体与排版

- **显示字体 Display**：超大号、紧字距。艺术感选 `Fraunces` / `Clash Display` / 思源宋体；时尚几何选 `Space Grotesk` / `Sora`。
- **正文**：`Inter` / 思源黑体，行高 1.6，字号 16–18px。
- **排版规则**：Hero 标题 ≥ 8vw；大量留白（呼吸感）；左对齐网格 + 偶发错位（打破规则制造设计感）。

## 4. 页面结构（单页滚动 + 锚点导航）

1. **Hero**：姓名 / 身份大字 + 冰蓝渐变描边 + 鼠标光晕跟随 + 一行简介 + 向下滚动提示。
2. **About**：个人简介 + 技能标签（蓝粉高亮）+ 一张艺术肖像。
3. **Work / Projects**：Bento Grid 卡片，hover 放大 + 冰蓝光晕，点击进入详情。
4. **Process / Services**（可选）：时间轴或步骤条。
5. **Contact**：大号 CTA + 社媒链接 + 邮件。
6. **Footer**：极简收尾。

## 5. 交互动画清单

**必做（MVP）**

- 自定义光标 + 蓝粉渐变光晕（hover 元素时放大）
- Hero 文字入场（逐行 / 逐字揭示，GSAP / Framer Motion）
- 滚动触发：区块淡入上移（IntersectionObserver）
- 作品卡片 hover：缩放 + 阴影 + 颜色光晕
- 平滑锚点滚动 + 导航高亮

**加分（差异化）**

- 鼠标视差（hero 元素轻微跟随光标）
- 3D 元素（Spline 悬浮几何体，蓝粉材质）
- 暗 / 亮主题切换（localStorage 记忆）
- 页面加载动画（进度条 / 文字揭示）
- 噪声纹理 / 颗粒感叠加（增强艺术气息）

## 6. 技术栈建议

- **代码派**：Next.js 14 (App Router) + Tailwind CSS + Framer Motion + GSAP；3D 用 react-three-fiber / Spline。
- **无代码派**：Framer / Webflow（强动画、设计感好，无需写代码）。
- **部署**：Vercel / Netlify；自定义域名；移动端对动效做降级处理。
- **性能**：图片压缩至 < 100KB、WebP；动画用 transform / opacity（GPU 友好）。

## 7. 可直接使用的生成 Prompt

### 中文 Prompt（可直接交给我，让我生成完整网站）

```
请为我生成一个个人作品集单页网站。
风格要求：大气、时尚、简洁兼具，有艺术气息与设计感；
主色调为黑白蓝粉（主色 Ink Black #0B0B0F / Paper White #F7F7FA，
强调色 Electric Blue #1F4DFF 与 Neon Pink #FF3D8B，招牌蓝粉渐变）。

必须包含：
1. 自定义光标 + 蓝粉渐变光晕；
2. Hero 超大标题，带蓝粉渐变描边与逐字入场动画；
3. 滚动触发区块动画（淡入上移）；
4. Bento Grid 作品集卡片（hover 缩放 + 光晕）；
5. 平滑锚点导航 + 导航高亮；
6. 暗 / 亮主题切换（记忆偏好）。

技术要求：用 HTML/CSS/JS 或 Next.js + Tailwind + GSAP/Framer Motion；
响应式、可访问（a11y）、加载快。
请输出完整可运行的代码与清晰的文件结构，并附带简单使用说明。
```

### 英文 Prompt（用于 Framer / Webflow / 海外 AI 工具）

```
Build a personal portfolio one-pager.
Aesthetic: bold, fashion-forward yet minimal, artistic and editorial.
Color system: black/white base with electric blue (#1F4DFF) and neon pink (#FF3D8B) accents, signature blue→pink gradient.

Must include:
- custom cursor glow
- hero with oversized type + gradient stroke + character-reveal animation
- scroll-triggered section reveals
- Bento Grid project cards with hover scale + glow
- smooth anchor nav + active highlight
- dark/light theme toggle (persisted)

Tech: Next.js + Tailwind + GSAP or Framer Motion.
Responsive, accessible, fast. Deliver complete runnable code + file structure.
```

---

*下一步可选项*：① 让我直接按上方中文 Prompt 生成可运行网站；② 你补充职业 / 姓名 / 作品数量，我再做定制版。
