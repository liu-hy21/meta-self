# SDD ledger — plan: docs/superpowers/plans/2026-11-10-relation-deep-workbench.md

Ruling: execute in the current checkout — the user explicitly authorized implementation, and the checkout already contains local chat data plus the design/spec artifacts that must remain available.

Pre-flight: Task 1 produces `ChatMessage`, `ChatArchivePage`, and `RelationMetrics`; Task 2 produces relation/archive persistence and people queries; Task 3 consumes both for server-rendered pages; Task 4 consumes Task 1 metrics and Task 2 report persistence. No interface conflicts found.

Task 1: complete (tests: `npx tsx scripts/verify-relation-archive.ts` -> PASS; 11,114 messages, 383 sessions)

Task 2: Ruling: `prisma migrate dev` detected checksum drift in two previously applied migrations and requested a destructive database reset; used an idempotent `prisma db execute --schema ... --file` migration that only creates the two new relation tables, preserving all existing data at the cost of Prisma migration history needing a later checksum cleanup.

Task 2: complete (tests: `npx tsx scripts/verify-relation-people.ts` -> PASS; bc initialized once, people=1)

Task 3: complete (tests: `npx tsx scripts/verify-relation-routes.ts` -> PASS; route smoke check -> HTTP 200 for profile/person/chat/analysis/ai; active nav links verified in rendered HTML)

Task 4: complete (tests: `npx tsc --noEmit` -> PASS; AI action persists RelationAiReport and exposes no-key/error state without leaking full archive to client)

Task 5: complete (tests: targeted ESLint -> PASS; `npm run build` compiled and completed route generation, then stopped on Next.js 16.4.0 security upgrade gate; full repo lint retains pre-existing errors outside this feature)

Follow-up: removed the standalone decorative page headers (large title plus eyebrow/subtitle) from all relation workbench pages; functional navigation, filters, metrics, controls, and person identity remain. Tests: route smoke -> HTTP 200 for all five pages; TypeScript and relation-module ESLint -> PASS.

Follow-up: relation analysis is now an explicit persisted task. People management shows pending/analyzed state and a calculate/recalculate server action; `RelationChatArchive.metricsJson` stores the snapshot and `analyzedAt` stores completion time. Analysis and AI pages read the snapshot and show a pending state until the task runs. Test: `npx tsx scripts/verify-relation-analysis.ts` -> PASS; test state reset to PENDING afterward.

Follow-up: removed the person context eyebrow/name/message-count block and all relation person logos/initial avatars. The person-detail back control remains as a plain `返回` link in the workbench navigation. Detail smoke check confirms no context block, no count, and no avatar class.

Follow-up: rebuilt person detail into exactly three editable attribute categories: 基础资料, 生活背景, 教育与职业. Added persisted RelationPerson fields, migration, server update action, read/edit states, and post-save redirect. Tests: TypeScript, route smoke, targeted ESLint, and HTTP 200 for view/edit states all pass.

Follow-up: moved the person-detail return control into the global TopBar immediately before `关系 · 人物详情`; it is now an arrow SVG icon with an accessible label, and the lower text button was removed.

Follow-up: simplified the person-detail page to retain only the 人物属性 section; removed relation type, archive status, recent interactions, action links, and the English `PERSON ATTRIBUTES` eyebrow. Detail smoke check confirms only the attribute area remains.

Follow-up: implemented persisted deep data analysis v2 for the chat archive. Added message coverage, content mix, expression rounds, 45-minute sessions, initiation, response samples, daily/weekly/weekday-hour rhythm, silence segments, topic evidence, temperature baseline, and five analysis views with raw-message evidence links. Tests: TypeScript, targeted ESLint, deep-metrics fixture, archive, people, routes, and analysis persistence all pass; five analysis URLs return HTTP 200. Demo database state reset to PENDING after verification.

Follow-up: added an analysis-page 指标说明 button and client modal. The modal lists the current snapshot value and calculation rule for 37 metrics across six sections, including data scope, content structure, sessions/rounds, response/silence, time rhythm, topics, temperature, thresholds, timezone, and evidence rules. Tests: TypeScript, targeted ESLint, methodology catalog, route smoke, and rendered入口 check pass; demo database state reset to PENDING afterward.

Follow-up: added the required per-person quantity and time metrics to the persisted snapshot and overview UI. Quantity metrics cover daily average/max animated emoji, images, and non-system messages plus opening share; time metrics cover longest silence in hours with 23:00–07:00 excluded and average reply speed after a >2-hour opening. Both self and bc values are shown, with the exact rules added to the methodology modal. Tests: TypeScript, targeted ESLint, deep metric fixture, methodology catalog, analysis persistence, and rendered label checks pass.

Follow-up: added the first analysis tab, 指标台账. It persists per-person metric name and calculation text in RelationMetricLedger, initializes the current 46 metric definitions on first access, and supports inline editing plus new metric creation. Tests: Prisma client generation, idempotent table creation, TypeScript, targeted ESLint, ledger read/write smoke, route smoke, and ledger HTML checks pass.

Follow-up: changed metric ledger rows from always-editable inputs to read-only display rows. Each row now has an 编辑 button; editing exposes the two fields with 确认 and 取消, and cancel only exits edit mode without submitting.

Follow-up: changed 新增指标 from an always-visible form to a modal opened by a button. The modal supports name and calculation fields, confirm/cancel, Escape, and backdrop close; successful submission uses the existing server action and revalidates the ledger page.

Follow-up: removed the metric ledger eyebrow and explanatory paragraphs, keeping only functional titles, the count, table, and actions. Added the preference to `design-system/metaself/MASTER.md`: functional pages should not carry decorative English eyebrows, duplicate subtitles, or low-value explanatory copy.

Follow-up: paginated the metric ledger at 10 rows per page with previous/next controls and numbered pages. Switching pages exits any unconfirmed row edit. TypeScript, ESLint, database smoke, and ledger HTTP checks pass.

Follow-up: limited displayed silence intervals and silence event candidates to segments of 30 hours or less. The underlying longest-silence metric remains calculated from the full archive.

Follow-up: added a visible y-axis to the 每周对话密度 chart with maximum, midpoint, zero labels, and aligned horizontal guide lines.

Follow-up: grouped the 新增指标 button and metric count into the ledger title bar, with the button on the left and count on the right; removed the separate add section.
Follow-up: reduced analysis navigation to three tabs: 指标台账, 数量指标, 时间指标. Reorganized existing panels and indicators without changing metric computation or definitions; quantity includes counts/content/topics/temperature, time includes rhythm/response/silence/sessions/events.
Follow-up: separated both 数量指标 and 时间指标 into explicit 文字展示 and 图展示 sections, keeping all existing metrics and computation unchanged while placing every text/table panel before the charts.
Follow-up: unified text-oriented metric presentation with a shared row-list component, consistent spacing, borders, numeric alignment, and restrained 10px card radius; retained table layouts only where column comparison or evidence scanning requires them.
Follow-up: aligned all paired 我 / bc text metrics in 时间指标 to the 时间类指标 comparison-table pattern, including 回复时间 and 表达轮次; global silence statistics remain in the shared single-value row-list pattern.
Follow-up: merged all paired time metrics into one comparison box with a single 我 / bc header; removed the individual 时间类指标, 回复时间, and 表达轮次 headings.
Follow-up: placed the unified paired time-metric box in the left column of the two-column text layout; it becomes full width on mobile.
Follow-up: aligned the 我 / bc column headers with the exact value columns by using the same three-column grid for the header and every metric row.
Follow-up: removed 沉默统计 and 关键节点候选, placed 沉默区间 and 密集区间 as two half-width panels in one row, and renamed 最密集会话 to 密集区间.
Follow-up: added 沉默区间 headers for 时长, 时间范围, and 证据, and matched its table typography and row spacing to 密集区间.
Follow-up: replaced 原文查看的加载下一段游标 with URL-driven numbered pagination at 80 messages per page, preserving active filters and reusing the relation ledger pagination styles.
Follow-up: consolidated link and button pagination controls into the same shared visual rule set so 原文查看 matches 指标台账 in size, spacing, borders, active state, and disabled state.
Follow-up: moved 原文查看 pagination into the filter bar immediately to the right of 应用筛选, removed the duplicate bottom pager, and kept mobile wrapping behavior.
Follow-up: changed 原文时间线 to a single left-aligned conversation flow; sender identity remains distinguishable through background and accent colors instead of opposing horizontal positions.
Follow-up: removed the redundant 原文页眉内容 SOURCE / ORIGINAL TRANSCRIPT, 原文时间线, and matched-message count so the filtered transcript starts directly below the controls.
Follow-up: removed the boxed ledger intro container; 指标台账, 新增指标, and the metric count now sit in a plain heading toolbar while the table remains the only content box.
Follow-up: removed decorative page-level headings and English eyebrow labels across 关系 screens, including 指标台账, 人物管理, 人物属性, AI control, AI report, temperature baseline, and the add-metric dialog; retained action, dialog, category, table, and data-group headings that provide task context. Added this rule to the reusable ui-design-taste skill.
Follow-up: moved 每日活跃轨迹 into 数量指标 / 图展示 and removed it from 时间指标 / 图展示; the chart and its original message-day links are unchanged.
Follow-up: removed 高频主题 and 话题词频 from the quantitative dashboard; moved the word-frequency output into the AI page as 主题线索 with evidence links and an explicit AI-reference label.
Follow-up: moved 消息量 and 消息量占比 into 数量类指标; removed those sender rows from 双方表达结构 and renamed the remaining content panel to 文字与媒体.
Follow-up: evidence links now calculate the source message page from its message ID and open 原文查看 at that page with the message anchor; applied to silence, dense-interval, topic, and AI evidence links.
Follow-up: changed 数量指标 / 文字展示 cards and the 数量类指标 comparison table to occupy the left half of the two-column layout; they become full width on mobile.
Follow-up: changed the original transcript to a two-column desktop timeline, splitting each page into chronological left and right halves; mobile collapses back to one column.
Follow-up: consolidated 数量指标 / 文字展示 into exactly two same-style half-width metric boxes; paired 我 / bc rows stay in the left 数量类指标 box, while single-value overview rows occupy the right 数量概览 box and stack on mobile.
Follow-up: removed gray helper details and repeated gray notes from text-based quantity/time metric displays; rows now show only metric labels and primary values, with methodology kept in the ledger/method view. Added the rule to the reusable ui-design-taste skill.
Follow-up: made all text-display metric rows ledger-backed; synchronized displayed metric names with the methodology/ledger catalog, corrected message-share denominator to non-system messages, linked each metric name to its ledger row, and added paginated target-page scrolling/highlighting for ledger navigation.
Follow-up: added target-message flash feedback for evidence links in 沉默区间 and 密集区间; anchored chat messages now flash for 1.8 seconds, with a reduced-motion static highlight fallback.
Follow-up: strengthened evidence feedback with a client-side target-message flash hook that re-triggers on Next route/query/hash changes, preventing CSS :target from being skipped during client navigation; added a stronger outline and pulse treatment.
Follow-up: replaced the CSS/Web Animations dependency with a JS timer that alternates inline outline and box-shadow styles on the target message, temporarily disables stale animation rules, and restores the original styles after 1.9 seconds; verified the inline highlight during a real browser route click.
Follow-up: increased relation workbench body typography by roughly 1–2px across chat text, person attributes, metric rows, tables, ledger content, AI prose, and methodology copy while leaving navigation, tabs, buttons, and decorative labels compact; restarted the local dev server and verified computed browser sizes.
