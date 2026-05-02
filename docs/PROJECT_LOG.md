# 项目工作日志 & 规划 (Project Log)

_本文档用于记录项目的长期目标、阶段性计划以及每日工作日志。_

## 🎯 当前大目标
构建一个基于终端 CLI 的极简多 Agent 决策引擎。
**核心架构已确立**：采用 **Cyber-VSM (赛博控制论体制)**，即基于 Stafford Beer 的生存系统模型 (VSM) 与罗马保民官“否决权 (Veto)”融合的极简三核架构（神谕核/战略、神盾核/审计、枢纽核/调度）。彻底摒弃“三省六部制”。

## 👤 用户偏好记录 (User Preferences)
*   **设计哲学**：极简主义 (Minimalism)。拒绝臃肿，架构要如无必要勿增实体。尽量依赖 `pi-mono` 现有模块进行微调和模块化封装。
*   **工作习惯**：
    *   工作必须有根据，留痕迹 (Traceability)。
    *   参考资料必须详实，需做独立深度研究并以文档形式互相链接。
    *   定期维护和编辑 Log，记录要求的变更和迭代过程，以保证开发上下文的延续。
*   **产品形态要求 (UI/UX)**：
    *   最终呈现为一个极简、优雅的终端命令行界面 (TUI)，体验类似于 Claude Code 或 Qwen Code。
    *   操作界面的舒适度很重要，但优先级靠后。先跑通底层核心逻辑，再进行 UI 层的精修。
*   **Prompt 工程规范 (Prompt Engineering)**：
    *   **语言选择**：System Prompt 的控制逻辑必须使用**全英文**（因为大模型对英文的结构化指令遵循度最高，且 Token 成本最低）。但明确告知大模型在输出给 User 看的文本（如摘要、奏折）时必须使用**中文**。
    *   **格式结构**：坚决避免使用长篇大论的“段落式”发散文本。System Prompt 必须使用结构化的 Markdown 语法，包含：`<ROLE>`, `<OBJECTIVE>`, `<RULES>`, `<OUTPUT_FORMAT>`。
    *   **强类型约束**：针对输出 JSON 的 Agent（如 Oracle 和 Aegis），必须在 Prompt 中注入对应的 TypeScript Interface 源码，强迫大模型按 Schema 输出。

## 📅 工作日志 (Work Log)

### 2026-04-28
*   **工程初始化**：创建了基础的 Node.js/TypeScript 工程，链接了 `pi-mono`。
*   **架构重构提议**：彻底放弃“三省六部制”，避免与开源竞品 (`danghuangshang`, `edict`) 撞车和抄袭争议。
*   **新架构设计 (Cyber-VSM)**：
    *   深入研究了罗马保民官、威尼斯十人会议以及智利 Project Cybersyn。
    *   提出了 `Oracle(规划) -> Aegis(审计/封驳) -> Nexus(路由调度)` 的极简三核模型。
    *   生成了独立的参考文档 (`ref-cybersyn-vsm.md`, `ref-roman-tribune.md`) 并在主文档中进行了关联。
*   **技术难点与通信路由攻坚**：
    *   **难点暴露**：发现 `pi-agent-core` 本质上是一个单 Agent 的执行循环，并没有原生提供类似 AutoGen 的多 Agent 聊天机制或双向通信通道。
    *   **行业研究**：调研了 LangGraph 的状态机、CrewAI 的树状 Tool 结构以及 AutoGen 的 Pub/Sub 模式。
    *   **解决方案 (Cyber-Router)**：决定采用基于 Node.js 原生状态机 (State Machine) 的强类型同步通信拓扑。由最外层的 TypeScript Controller 控制流转，Agent 之间不进行自然语言闲聊，只做强类型的 `Blueprint` (JSON) 传递。Aegis 产生的 Veto 事件由控制器捕获并强制通过 `Oracle.continue(rejectReason)` 注回原链路。
    *   **执行簇细化 (Actuators/Pods)**：根据用户对“执行打工人”的提问，深化了 System 1 的设计。将其设定为类似于“六部”的 3 个分工明确的底层 Agent：**Pod Alpha (情报探测)**、**Pod Beta (量化演算)**、**Pod Gamma (红蓝对抗)**。Nexus 调度器并发调用它们，汇总成多维度的决策奏折。
    *   **关于工具容错性与角色划分的探讨**：针对用户提出“是否需要将联网工具与本地工具分配给不同 Agent 以防止网络超时导致任务崩溃”的问题，确立了**“角色划分按认知功能，容错机制放下到底层工具库”**的设计原则。维持 Pod Alpha/Beta/Gamma 按职能分工的极简性，将网络超时、重试等异常捕获机制下沉封装到具体的 Tool 实例中（即工具异常时返回 Soft Error 而不是直接 crash 整个 Agent Loop）。
    *   **Phase 1 核心代码脚手架落成**：
        *   定义了核心的类型定义文件 `src/types.ts` (`Blueprint`, `AegisReview`, `DecisionReport`)。
        *   编写了混合双语的 System Prompts (`src/prompts/*.ts`)，以适应顶级国产大模型的推理特性。
        *   编写了极简的 `src/orchestrator.ts`（赛博协调器）。完整实现了基于原生 `pi-agent-core` 的控制流状态机，打通了 `Oracle -> Aegis (Veto循环) -> 触发 Promise.all 并发 Pods -> Nexus 汇总奏折` 的完美单向异步数据流。
        *   建立了 `src/pods/index.ts` 占位逻辑，展示了底层打工人是如何与主流程分离并实现异步并发执行的。
    *   **厂商抹平与安全规范 (Provider Normalization & Security)**：
        *   **厂商对齐**：采用了与 `pi-mono` 一致的 `Model` 注入模式。通过 `@mariozechner/pi-ai` 抹平了 DeepSeek, Qwen, MiniMax 等国产大模型与 OpenAI 格式的差异，使得引擎可以无缝切换底层驱动。
        *   **安全脱敏**：严禁硬编码 API Key。建立了 `.env.example` 模板，指导用户通过环境变量安全管理敏感凭证。
        *   **工具复用与标准对齐**：经调研，`pi-mono` 并不在核心层硬编码 Web 搜索，而是通过 **“Agent Skills”标准** 动态加载（如 `brave-search` skill）。为保持本项目极简且独立，我们将不使用外部的 `gemini_scripts` 脚本，而是计划在 `src/pods/` 下实现一个标准的、符合 `pi-agent-core` 规范的 `WebSearchTool`。这将直接调用主流搜索 API（如 Brave 或 Tavily），确保代码的专业性与纯粹性。
    *   **架构升级与全员 AI 化 (Phase 1.5)**：
        *   **原生集成与协议抹平**：彻底抛弃了手写的 OpenAI 兼容转换器，直接深度利用 `pi-mono` 官方的 `getModel` 和 `getEnvApiKey` 机制。利用 `pi-mono` 的底层支持，成功接入 `minimax-cn:MiniMax-M2.7`（原生支持了 Anthropic 通信协议），使得系统能零阻力对齐各大厂商的私有接口。
        *   **执行簇 (Pods) 的大模型赋能**：将 `src/pods/index.ts` 里的“死代码 (Mock setTimeout)”彻底推翻。重构为利用 `pi-agent-core` 的 `Agent` 类，给每个打工人 (Alpha/Beta/Gamma) 分配了**独立的性格 Prompt (`src/prompts/pods.ts`)**，并让它们继承协调器的 Model 实例。至此，系统真正实现了“一句话派发，多个大脑并发推理”。
        *   **流转反馈体验优化 (UX)**：为了缓解由于极简架构缺乏 Stream 输出而导致的“终端假死”现象，我们没有做复杂的重构，而是通过极其简单的 ANSI 控制符在终端中实现了一个原地的、实时的 **Agent 进度倒计时刷新动画 (`withTimer`)**。在保持底层数据流单向同步传输（仅传递 JSON）的同时，极大提升了用户层面的感知体验。
    *   **架构认知统一：Skill vs Tool**：通过深挖 `pi-mono` 源码，明确了 `Agent Skills`（本质是供 Agent 阅读的 Markdown SOP 文本）与 `AgentTool`（通过 TypeBox 验证参数并原生执行 TypeScript 代码的工具机制）的本质区别。

### 2026-04-30 (Phase 2 & Phase 3)
*   **原生 Tool 机制实装 (Phase 2)**：
    *   遵循 `pi-agent-core` 的 `AgentTool` 标准，移除了对外部脚本的依赖，在 `src/tools/` 下编写了原生 TypeScript 工具。
    *   **WebSearchTool**：最初尝试使用 NewsAPI，后因其对 Agent 不够友好且常返回空内容，果断切换至**专为大模型打造的 Tavily API**。它不仅极其稳定，且直接返回干净的 Markdown 格式 `answer` 和 `results`，极大防止了 Agent Token 爆炸。
    *   **BashTool**：实现了本地 Shell 脚本执行能力（供量化分析使用），并完善了超时和标准输出错误捕获。
*   **执行簇 (Pods) 的全面武装**：
    *   修改 `createPodAgent` 将上述工具作为 `initialState` 挂载。
    *   为 **[Pod Alpha 情报员]** 和 **[Pod Gamma 风控员]** 装备了 `webSearchTool`。
    *   为 **[Pod Beta 量化员]** 装备了 `bashTool`。
*   **健壮性修复：多轮流转与错误捕获**：
    *   确认了 `pi-agent-core` 的原生多轮机制（思考 -> 调工具 -> 看结果 -> 再思考）运转正常。
    *   **修复了“无输出” Bug**：重构了 `getAgentOutput` 函数。因大模型在多轮调用时最后一条消息可能仅仅是一个 ToolCall（由于超轮数或出错），新逻辑会优先向上抛出 `agent.state.errorMessage`，并在未出错时**倒序查找**最近的一条有效 Text 消息，大幅提升了系统的容错解释性。
*   **基于事件订阅的前后端解耦与 TUI 美化 (Phase 3)**：
    *   **问题暴露**：并发执行模型（`Promise.all`）导致多个 Pod 的 `console.log` 交叉打印、严重刷屏。
    *   **源码学习与重构**：深入学习了 `pi-mono` 的 TUI (`interactive-mode.ts`) 和后端 (`agent-session.ts`) 分离设计，发现核心逻辑依赖于 `agent.subscribe()` 派发的 `tool_execution_start/end` 事件。
    *   **纯粹性改造**：将所有 `console.log` 从工具库（`web-search.ts`, `bash.ts`）内部彻底剥离，实现了工具逻辑的绝对纯净。
    *   **UI 注入**：引入了 `ora`（动态加载动画）和 `chalk`（终端样式）。在 `src/pods/index.ts` 顶层维护了一个全局的动态 Spinner 和活跃任务计数器（`activeToolsCount`）。
    *   **最终效果**：在终端实现了一个极简的灰色斜体单行滚动日志 (`[⚙️ 并发神经簇] 正在执行 X 个并行任务...`)。既不干扰主体内容，又完美呈现了多 Agent 并发作业的高级感。

*   **神兵利器锻造：四大原生工具实装 (Phase 4)**：
    *   **严守闭源原生原则**：拒绝直接挂载外部 Markdown Skills，确保框架执行的绝对封闭性与稳定性。基于 `@mariozechner/pi-agent-core` 的严格 `TypeBox` 标准，新开发并全面覆写了工具的泛型校验与 `details` 返回约束。
    *   **`FileWriterTool` (公文存档)**：实现分析报告持久化，默认写入至配置文件夹 `Gemini_Generated_Docs/CyberVSM`。
    *   **`TimeTool` (时间刻度)**：无依赖原生的时区查询工具，为需要对齐全球交易开盘时间的量化评估提供时间基准。
    *   **`ReadUrlTool` (网页精读)**：纯原生 `fetch` + 极简正则清洗，秒级剥离网页干扰项提取正文，并带 Token 截断保护，支持外媒与研报全文抓取。
    *   **`MemoryTool` (神经突触)**：基于本地 JSON 的 Key-Value 轻量记忆库，赋予特工跨越多次对话生命周期的经验传承与检索能力。

*   **架构涌现特性确立：动态水平扩容 (Dynamic Horizontal Scaling)**：
    *   **按需克隆 (Spawn-on-Demand)**：在极其复杂的综合指令测试中确认了系统的非凡涌现能力。神谕核 (Oracle) 在拆解任务蓝图时，若规划出多个同职能动作，中枢协调器会通过 `Promise.all` **瞬间克隆多个独立的特工实例**（如：同时启动两名 Pod Alpha 斥候分别搜索）。
    *   **Serverless 极简内存管理**：这些克隆体各自拥有独立内存上下文，完全并行处理，执行完毕后立即被 V8 引擎垃圾回收（GC）。这使得系统拥有类 Serverless 的无限横向弹性，且杜绝了内存溢出。

*   **TUI 进化与文化溯源 (Phase 4.5)**：
    *   **多行并发赛博大屏 (Multi-line Dashboard)**：摒弃了原本会导致内容互相覆盖的单行 Spinner，使用原生 Node.js `readline` 手写了一个基于光标控制的并发任务看板。系统水平扩容出多少个大脑，大屏上就会瞬间展出多少行进度条，互相独立汇报状态并在结束后平滑销毁。
    *   **本地化文化代号 (Cultural Local Naming)**：为了将“赛博控制论”与“古典官僚制”的缝合美学推向极致，放弃了无趣的数字序列号，全面采用中国古代情报与监察官制进行动态赋名（Alpha 局的“不良人/缇骑/苍鹰”、Beta 局的“算学博士/司库/神机”、Gamma 局的“御史/廷尉/纠弹使”）。无需联网即可在本地随机生成，极大增强了终端操作的史诗感与代入感。

### 2026-05-01
*   **开源生态建设与库重命名**：
    *   将本地项目文件夹、`package.json` 及 GitHub 远程仓库正式从 `chaoting-agent` 更名为 **`cyber-vsm`**。
    *   重构了全新的 `README.md`，注入了极强的文学设定（古典权谋官僚制）与技术基座说明，同步开源至 GitHub (`Gabriel017yy/cyber-vsm`)。
*   **底层幽灵 Bug 修复（LLM 幻觉溯源）**：
    *   **排查 `未获得有效输出 这里是为什么呢？`**：发现最外层的 Nexus 竟然输出了这句反问。追踪源码发现，底层 `pi-agent-core` 返回的 `msg.content` 被部分 LLM 填充为纯字符串，而 `getAgentOutput` 函数使用了数组的 `.find` 方法，导致抛出 `TypeError: msg.content.find is not a function`。
    *   该 Error 被外层的 `try-catch` 作为 `softError` 发送给了 Nexus。Nexus 作为一个有逻辑的大模型，看到了底层全线崩溃的报错，于是自己“幻觉”总结出了上述的反问句。
    *   **修复**：在 `getAgentOutput` 中增加对纯字符串 `content` 的类型断言拦截（绕过 TypeScript 误判的 `never` 类型）；同时在 `cli.ts` 增加了对 `executiveSummary` 字段遗失的容错 Fallback 处理。完美解决了极端情况下的崩溃与大模型疑惑行为。

### 2026-05-02
*   **架构升级：锦囊三策 (Actionable Strategic Guidelines)**：
    *   **痛点**：用户指出先前的 `APPROVE | REJECT | REQUIRE_MORE_INFO` 过于绝对化且二元，无法适应开放性战略问题（例如：“分析某股票是否值得投资”不一定有简单的通过/驳回）。
    *   **重构**：将 `DecisionReport` 中的 `recommendedAction` 彻底重构为 `recommendedActions: ActionGuideline[]`。
    *   **文化映射**：在 Prompt 中要求大模型基于底层情报给出 1~3 条具体可落地的战略方针，并在 TUI 端呈现为极具历史代入感的“锦囊三策（上中下三策）”，兼顾了建议的具体性与执行指导价值。

*   **Phase 4: 持久化记忆融合 (System Reflection)**：
    *   **设计思考**：拒绝增加新的 `Agent` 增加延迟和开销，将“反思与总结”职责直接交给具有全局视角的枢纽核 (Nexus)。
    *   **大模型多任务特性利用**：大模型（如 MiniMax/DeepSeek）能在单次 Prompt 生成中同时完成“报告总结”与“系统反思”。在 `DecisionReport` 中新增 `systemReflection` 结构，包含 `isValuable`、`methodologySOP` 和 `optimalTopology`。
    *   **闭环进化**：每次运行结束，若 `isValuable === true`，自动存入 `data/cyber_memory.json`。下次运行时，将全量历史记忆挂载到 Oracle 的 `<EXPERIENCE_MEMORY>` 中，实现跨对话的最佳实践（Agent 拓扑和分析思路）复用。
    *   **术语去修辞化**：根据极简提示词原则，不使用“太庙”、“史书”等古代词汇给大模型增加理解门槛，而是采用极客风的 `System Reflection`、`Optimal Topology` 等精准计算机术语。
    *   **工业级文档重构**：参考 GitHub 顶级开源项目的 Best Practices，使用英文全面重构了 `README.md`。引入了 Shields.io 徽章、Mermaid 架构图、以及清晰的 Core Features 和 Design Philosophy 章节，极大地提升了项目的极客感与专业度。
    *   **项目品牌升级 (Project Renaming)**：将过于抽象的 `Cyber-VSM` 全面更名为 **Cyber-Stratagem (赛博锦囊)**，使其更具“提供破局谋略”的产品隐喻，同时兼顾了英文（Stratagem 奇谋）与中文（锦囊）的全球化调性。

*   **Phase 5: 交互式引导与控制台指令 (Setup Wizard & Slash Commands)**：
    *   **零崩溃启动体验**：废弃了之前“缺 Key 直接报错退出”的硬编码逻辑。如果检测到环境变量为空，系统会自动唤起友好的 Setup 向导，提示用户选择模型 (MiniMax/DeepSeek/Qwen) 并输入 API Key。
    *   **零依赖开发**：坚持极简主义，没有引入 `inquirer` 这种重型交互库，而是巧妙利用 Node.js 原生的 `readline` 实现了多步交互。
    *   **持久化密钥**：利用 `fs.appendFileSync` 自动将用户输入的凭证写入 `.env` 文件，实现“一次配置，永久生效”，并且通过热修改 `process.env` 做到即时热更新。
    *   **斜杠指令系统**：对 CLI 输入流进行劫持拦截，实现了 `/login`（随时热切换模型）、`/clear`（清屏）、`/help` 等控制台原生指令。极大提升了工具的“产品化”完成度。

*   **下一步行动 (Next Steps)**：
    *   **Web/微信端接入准备**：开始尝试将当前的 TUI 控制台逻辑与底层引擎逻辑进一步解耦，为未来暴露 RESTful API 或接入微信机器人做前置准备。
    *   **持久化记忆融合**：研究在多轮对话启动前，如何将 `MemoryTool` 中的关键记忆自动化注入到神谕核 (Oracle) 的背景上下文中，实现真正的系统进化。
