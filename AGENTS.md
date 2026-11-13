<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Visual design principle

Avoid Unnecessary secondary labels and descriptions. Let the layout do the explaining.

### 财商页面铁律

不使用英文解释性眉题、标签或小字；只保留股票代码、币种、单位、品牌名称和技术字段等业务必需英文，其余说明用中文或直接省略。

所有模块标题统一使用 `16px`、`font-semibold` 的模块标题样式；页面级主标题可以单独使用更大的字号。

财商 UI 规范与业务规则分离：模块之间保持 `24px` 外间距；卡片统一使用 `24px` 内边距、`16px` 圆角、同一套边框和轻阴影；卡片内部使用 `12px` 间距，列表行使用 `24px` 横向和 `16px` 纵向内边距；响应式只改变布局，不随意改变间距层级；悬停、聚焦和选中态不得改变布局尺寸。

财商下拉框不得使用浏览器默认外观：统一使用自定义背景、边框、圆角、内边距、字体、箭头和聚焦态，优先复用财商共用选择器样式。

下拉选项面板本身也必须沿用财商卡片配色和交互状态；仅给原生 `select` 加外框不算完成。面板不得被卡片或滚动容器裁切，支持键盘选择与 Escape 关闭。
