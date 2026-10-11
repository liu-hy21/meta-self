# Stack scaffold

在父 skill 勾到第 4–5 步时读这份。

## 1. Next.js

在目标目录：

```bash
npx create-next-app@latest --help
```

用最新 CLI 建 App Router + TypeScript + Tailwind + ESLint。优先：

- App Router（不要 Pages Router）
- `src/`
- `@/*`
- Tailwind（CLI 若拆成独立问题，选 yes）

不要加这个父 skill 没要求的 UI 库，除非用户点名（如 shadcn）。点名了再装，并补跑：

```bash
python3 ".cursor/skills/create-next-prisma-app/children/ui-ux-pro-max/scripts/search.py" "button form dialog" --stack shadcn
```

## 2. Prisma

```bash
npx prisma@latest init
```

默认 `provider = "postgresql"`。用户只要本地零配置再用 `sqlite`。

`src/lib/db.ts` 单例（防 dev 热重载打满连接）：

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

数据访问放 `src/lib/` 或 `src/server/`，只从 server 文件 import。

`.env`：`DATABASE_URL`。`.env.example` 只留变量名。

改 schema 后：

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 3. 推荐目录

```
src/app/              # routes, layouts, server pages
src/app/actions/      # server actions
src/components/       # 默认 RSC；交互组件标明 client
src/lib/db.ts
src/lib/queries/      # prisma 查询
prisma/schema.prisma
```

## 4. 性能速查（Vercel React）

写代码时至少守这几条；细则在 `children/vercel-react-best-practices/rules/`：

- `async-parallel` / `async-defer-await`
- `bundle-barrel-imports` / `bundle-dynamic-imports`
- `server-cache-react` / `server-serialization`
- `rendering-conditional-render`（用三元，不用 `&&` 渲染 0）

## 5. UI 验收

1. 已有 `design-system/**/MASTER.md` 就先读，不要重生成。
2. WebFetch Web Interface Guidelines，按 `file:line` 记违规。
3. 浏览器走主路径：导航、表单、空态、错误态。布局改了就看桌面和窄屏。
