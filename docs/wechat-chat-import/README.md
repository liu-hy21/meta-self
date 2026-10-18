# 微信聊天记录导入

完整说明见 **[PIPELINE.md](./PIPELINE.md)**。

脚本目录：`scripts/`（PowerShell，Windows + PC 微信）。

本机截图与 OCR 素材放在 `docs/wechat-history/`（已加入 `.gitignore`，不进仓库）；合并结果可提交 `docs/聊天记录.json`。

当前仓库中的 `docs/聊天记录.json` 若含 `final-jul` 时代生成的内容，应视为 **无效**；请按流水线用真实分片重新 `merge-export`，并通过 `qa-export` 后再使用。
