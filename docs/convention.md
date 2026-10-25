# 全局设计规范

对照当前实现：`src/app/globals.css`、`src/components/ui/form-shell.tsx`、`src/components/shell/main-shell.tsx`。新页面按本文写，不要另起一套边距、最大宽度或按钮高度。

应用里有两套皮肤，间距规则共用，外形不同。

| 皮肤 | 用在哪 | 根 class |
| --- | --- | --- |
| 像素 | 看板、身体/心态/工作/关系/财商/玩商、采集、仓库、英语 | `pageWrap`（即 `q-page`） |
| Q 版 | 厨房、家务 | `pageWrapKitchen`（`q-kitchen q-page`）、`pageWrapHome`（`q-home q-page`） |

Q 版只给家庭里这两个页面。其它主页面保持直角、硬阴影的像素风。

## 壳层

主区域包在 `.monitor` 里：4px 墨色边、`8px 8px 0` 硬阴影、米色底加细横纹。壳层外是书桌色 `--desk` 和 8px 网格。

从左到右：侧栏、顶栏 + 滚动内容。心态 / 工作 / 关系档案，以及厨房看板，右侧还有一条竖栏（宽 320px），内容随当前页变化：档案页是对应日志，厨房是菜的做法。身体档案在主区域填写，不使用这条栏。其它主页面不显示这条栏。日志写在竖栏里，用 `RailPortal` 挂进去，不要再做独立的采集菜单。内容区自己滚动，页面不要再套一层全屏滚动容器。

侧栏图标：`viewBox="0 0 16 16"`，`strokeWidth="1.75"`，`strokeLinecap="square"`，class `size-4`。

主内容滚动在 `main-shell` 里带 `data-main-scroll` 的 `overflow-y-auto` 容器上，不是 `window`。凡在同一页用查询参数切换「记一条 / 修改 / 返回」或保存后回到列表，都**不能**把这条滚动条拉回顶部。

## 身体档案（`/body/profile`）

主区域分两块，不要混成一种交互。

| 类型 | 内容 | 交互 |
| --- | --- | --- |
| 固定数据 | 身高、生日、性别、血型；饮食习惯 | 卡片上「修改」，保存后仍用固定档案，不是记一条 |
| 快照 | 身体测量、体检、睡眠、看病 | 「记一条」打开 `PixelModal` 弹窗；除**体检**外日期按保存当天自动记；**体检**为自选日期 + 上传报告图片（`multipart`，存 `storage/body-exam-images`，经 `/api/body/exam-images/[id]` 读取） |

**视觉**：身体页是独立的「临床监护台」皮肤，根节点 `${pageWrap} vital`。深墨绿底、细线网格、薄荷色信号线，数字用等宽字体。不要套 `pixel-box` / `submitClass`，也不要用家庭的 Q 版样式。样式在 `globals.css` 的 `.vital*` 一节；按钮用 `vital-btn` / `vital-btn vital-btn--solid`，面板用 `vital-panel`（`data-tone="amber" | "coral"` 换顶边色）。

快照历史列在对应面板里。不用右侧竖栏，不用 `RailPortal`。实现见 `src/components/body/body-console.tsx`、`src/components/body/vital-modal.tsx`；URL 解析 `resolveSnapshotModalOpen` 在 `src/lib/body-snapshot-modal.ts`（服务端可调用）。

外链仍可用 `?measureWrite=1` / `?examWrite=1` / `?sleepWrite=1` / `?medicalWrite=1` 打开对应弹窗（进入后 URL 会清掉查询参数）。弹窗内保存用 `ProfileActionForm` 的 `afterSuccess="refresh"`，不要用 `navigate`。

## 主区域滚动（记一条 / 返回 / 保存）

实现：`src/components/shell/main-shell.tsx`（`data-main-scroll`）、`src/components/ui/preserve-scroll-link.tsx`、`src/components/body/profile-scroll-restore.tsx`、`src/components/body/profile-action-form.tsx`。

**固定数据的「修改 / 返回」** 用 `PreserveScrollLink`，不要用裸 `Link`。它会在跳转前把 `data-main-scroll` 的 `scrollTop` 写入 `sessionStorage`，并设 `scroll={false}`，避免 Next 默认滚到页顶。快照「记一条」用弹窗，不走路由，主区域滚动自然不变。

**页面** 在 `pageWrap` 根下挂：

```tsx
<Suspense fallback={null}>
  <ProfileScrollRestore />
</Suspense>
```

`ProfileScrollRestore` 在 `pathname` / `searchParams` 变化后（仅 `/body/profile`）从 `sessionStorage` 恢复滚动；必要时用 `requestAnimationFrame` 多试几次，等布局稳定。

**表单保存** 用 `ProfileActionForm` 包一层，不要用裸 `<form action={serverAction}>`。身体档案相关 Server Action **不要** `redirect("/body/profile")`：保存成功后由客户端 `router.replace("/body/profile", { scroll: false })` 关掉 `?measureWrite=1` 等参数；校验失败返回 `{ ok: false }`，不跳转。提交开始时同样先 `saveMainScrollPosition()`。

厨房 / 家务等同页模式切换已在链接上使用 `scroll={false}`；若滚动容器仍是 `data-main-scroll`，可复用 `PreserveScrollLink` 与恢复逻辑，不要另写一套「保存后整页跳顶」的 `redirect`。

## 页面宽度与间距

所有主页面占满内容栏宽度，**不要**加 `max-w-*`、`mx-auto` 把整页收窄，也**不要**用 `p-4` / `px-6 py-5` 当页面根。

根节点用 `form-shell` 导出的常量：

```tsx
import { pageWrap } from "@/components/ui/form-shell";

<div className={pageWrap}>...</div>
```

`.q-page`（`globals.css`）的数值：

| 属性 | 值 |
| --- | --- |
| 宽度 | `100%` |
| 方向 | 纵向 flex |
| 区块间距 | `gap: 1.5rem`（24px） |
| 内边距 | 上 `1.25rem`，左右 `1rem`，下 `1.5rem` |
| `sm`（640px）起 | 左右改为 `1.5rem` |

同一页里并排的卡片列，间距也用 `gap-6`（24px），与 `.q-page` 的 gap 对齐。例如看板两列。

页内卡片、列表项的内边距用 `p-4`（16px）。列表条目之间用 `space-y-3`（12px）。这是卡片内部，不是页面根。

## 颜色

定义在 `:root`，用变量，少写死色值。

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--bg` | `#efe6d4` | 显示器内背景 |
| `--panel` | `#fff8ec` | 卡片、输入底 |
| `--ink` | `#1c1917` | 字、边框 |
| `--muted` | `#57534e` | 次要说明 |
| `--gold` | `#c4a06a` | 主按钮、焦点环 |
| `--gold-deep` | `#8c6a45` | 强调正文 |
| `--desk` | `#3a332b` | 壳层外 |
| `--color-destructive` | `#9b3d3d` | 错误 |

字体：`--font-pixel`，等宽回退。正文 16px，行高 1.6。控件继承字体，默认 `border-radius: 0`。

焦点：`outline: 2px solid var(--gold)`，`outline-offset: 2px`。

## 像素风组件

来自 `src/components/ui/form-shell.tsx`。

| 导出 | 样子 |
| --- | --- |
| `.pixel-box` | 2px 墨边，`4px 4px 0` 硬阴影，`--panel` 底，直角 |
| `Panel` | `pixel-box p-4`，标题 `text-sm font-semibold`，内容 `mt-3` |
| `labelClass()` | `text-xs font-medium` |
| `fieldClass()` | 全宽，`min-h-11`，2px 墨边，内阴影，金色焦点环 |
| `submitClass()` | 高 32px（`h-8`），`px-3`，`text-sm`，金底，硬阴影 |
| `backClass` | 同尺寸，`--panel` 底，无硬阴影 |

主操作用 `submitClass()`，返回/次要用 `backClass`。不要再写一套 `h-9` / `h-10` 的页头按钮。

档案页的只读块：`border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3`。

空状态：居中，`text-xs leading-5 text-[var(--muted)]`，文案宽度最多 `max-w-sm`（只限这一小段字，不是整页）。

## Q 版（厨房 / 家务）

根上同时挂皮肤和页面壳：`pageWrapKitchen` 或 `pageWrapHome`。皮肤变量：

| Token | 值 |
| --- | --- |
| `--q-ink` | `#4a3326` |
| `--q-cream` | `#fff6e6` |

色调用 `data-tone`，写在区块上，子元素读 `--q-tone` / `--q-tone-soft`。

家务：`sun` 黄、`mint` 绿、`lilac` 紫。厨房：`tomato` 珊瑚、`mint`、`sky`。

| class | 用途 |
| --- | --- |
| `.q-hero` / `.q-home-hero` | 页头，圆角 28px，3px 边，底阴影 6px |
| `.q-block` | 大区块，圆角 26px |
| `.q-block-head` | 区块头，底边 3px，格纹底 |
| `.q-col` | 列卡片，圆角 20px |
| `.q-item` | 列表项，圆角 14px |
| `.q-btn` | 胶囊按钮，高 2.4rem，3px 边 |
| `.q-field` | 圆角 16px 输入 |
| `.q-chip` / `.q-title-pill` / `.q-tag` | 计数与小标签 |
| `.q-badge` | 圆形图标座 |
| `.q-check` / `.q-progress` / `.q-pill-radio` | 勾选、进度、分段 |

Q 版按钮、输入不要换成 `submitClass()` / `fieldClass()`。像素页也不要套 `.q-btn`。

动效 120ms。`prefers-reduced-motion: reduce` 时关掉位移。

## 写新页面时

1. 根节点：`pageWrap`。厨房用 `pageWrapKitchen`，家务用 `pageWrapHome`。
2. 主区块：像素用 `pixel-box`（或 `Panel`），Q 版用 `.q-block`。
3. 区块之间靠 `.q-page` 的 `gap`，根上不要再叠 `space-y-*`。
4. 主按钮 / 返回：像素用 `submitClass()` / `backClass`，Q 版用 `.q-btn`。
5. 输入：像素用 `fieldClass()` + `labelClass()`，Q 版用 `.q-field`。
6. 整页不要设 `max-w-*`。`max-w-sm` 只给空状态那一行字。
