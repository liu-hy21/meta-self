---
name: create-next-prisma-app
description: >-
  Scaffolds and builds product apps on latest Next.js (App Router), React,
  TypeScript, Tailwind CSS, and Prisma. Parent skill that composes
  vercel-react-best-practices, Vercel Web Interface Guidelines, and UI UX Pro Max.
  Use when creating a new project, starting a Next.js app, adding Prisma,
  bootstrapping a full-stack TypeScript web app, or when the user asks to
  建项目 / create-next-app / scaffold.
---

# Create Next.js + Prisma App

建一个产品项目时走这套父 skill。不要自己另选栈。不要跳过子 skill。

## Locked stack

| Layer | Choice |
|---|---|
| App | `create-next-app@latest`，App Router |
| UI | React + TypeScript + Tailwind CSS |
| Data | Prisma（默认 PostgreSQL；用户明确要求再用 SQLite） |
| Layout | `src/` + `@/*` |

先跑 `npx create-next-app@latest --help`，用**当前 CLI 的真实 flag**，不要背旧 flag。

## Child skills（必须加载）

本 skill 目录：`.cursor/skills/create-next-prisma-app/`

| 顺序 | 子 skill | 路径 | 干什么 |
|---|---|---|---|
| 1 | UI UX Pro Max | [children/ui-ux-pro-max/SKILL.md](children/ui-ux-pro-max/SKILL.md) | 设计系统、配色、字体、UX |
| 2 | Web Interface Guidelines | [children/web-design-guidelines/SKILL.md](children/web-design-guidelines/SKILL.md) | 可访问性 / 交互 / 表单 |
| 3 | Vercel React Best Practices | [children/vercel-react-best-practices/SKILL.md](children/vercel-react-best-practices/SKILL.md) | RSC、水合、bundle、waterfall |

**每个子 skill 的 `SKILL.md` 都要 Read 完再动手。** 细则按需再读 `rules/` 或跑 search。

UI UX Pro Max 搜索脚本（用绝对/技能内路径，不要假设 cwd）：

```bash
python3 ".cursor/skills/create-next-prisma-app/children/ui-ux-pro-max/scripts/search.py" "<query>" --design-system -p "<Project>"
python3 ".cursor/skills/create-next-prisma-app/children/ui-ux-pro-max/scripts/search.py" "<keyword>" --stack nextjs
python3 ".cursor/skills/create-next-prisma-app/children/ui-ux-pro-max/scripts/search.py" "<keyword>" --stack html-tailwind
```

Web guidelines 每次 UI 交付前现拉：

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

React 性能：写页面 / 拉数 / 加 client 组件时，对照子 skill 的 8 类规则；需要例子再读对应 `children/vercel-react-best-practices/rules/<id>.md`。

## Workflow

复制并勾进度：

```
- [ ] 1. 读三个子 skill 的 SKILL.md
- [ ] 2. 确认产品类型、页面清单、数据实体
- [ ] 3. UI UX Pro Max --design-system，需要跨会话则 --persist --output-dir <project-root>
- [ ] 4. create-next-app@latest 脚手架（见 stack.md）
- [ ] 5. Prisma schema + singleton client + server-only 数据层
- [ ] 6. 按设计系统实现页面（RSC 默认，client 最小）
- [ ] 7. Fetch Web Interface Guidelines，过一遍新 UI
- [ ] 8. 对照 Vercel React 规则扫 waterfall / barrel import / 多余 client
- [ ] 9. 浏览器端到端点主路径；失败则修再验
```

## Hard rules

- 默认 Server Component。`'use client'` 只给真正的交互。
- Prisma 只出现在 Server Component、Route Handler、Server Action。禁止 import 进 client。
- 独立请求 `Promise.all`；不要无故串行 `await`。
- 禁止 barrel `index.ts` 再导出重型模块。
- 设计 token 走 CSS 变量 / Tailwind theme，组件里不散落 raw hex。
- 焦点环、可见 label、错误贴字段、触控目标 ≥ 44px，不要为「好看」拿掉。
- 未授权不要 `--force` 覆盖已有 `design-system/**/MASTER.md`。

## After scaffold

细节命令、目录、Prisma 单例见 [stack.md](stack.md)。
