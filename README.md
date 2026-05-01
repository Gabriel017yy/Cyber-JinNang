# 🏛️ Cyber-VSM (赛博朝廷决策引擎)

基于 **古典官僚制 (唐代监察体系)** 与 **现代控制论 (Stafford Beer's VSM)** 深度缝合的极简多智能体并发调度框架。这不是一个供人闲聊的 Chatbot，而是一台**无情的国家机器**。

## 📜 核心角色与职能设定 (Character Lore & Mechanics)

Cyber-VSM 由三大中枢核心（宏观调度）与三大执行局（微观并发）构成。

### 1. 中枢大脑：三核决策层
负责意图解析、风险阻断与任务调度，纯逻辑推理层，不直接接触外部环境。

*   **👁️ 神谕核 (Oracle / 战略起草)**
    *   **文学设定**：大唐中书省，皇帝的绝密战略大脑。
    *   **设计理念**：将人类模糊的宏大意图，降维打击为机器可执行的具体步骤。
    *   **技术机制**：强类型 JSON Blueprint 生成。只输出高度结构化的蓝图，不含任何多余自然语言。
*   **🛡️ 神盾核 (Aegis / 逻辑封驳)**
    *   **文学设定**：大唐门下省 / 古罗马保民官。铁面无私，手握一票否决权 (Veto)。
    *   **设计理念**：绝对的安全底线。防止大模型出现“幻觉”或制定出具有毁灭性风险的行动计划。
    *   **技术机制**：审查蓝图，若发现漏洞，强制触发状态机的 Reject 回调，将驳回理由直接注回 Oracle 的上下文中逼迫其重构。
*   **⚙️ 枢纽核 (Nexus / 并发路由)**
    *   **文学设定**：大唐尚书省，国家机器的绝对执行中枢。
    *   **设计理念**：运筹帷幄，统揽全局，将散落的情报融合成最终奏折。
    *   **技术机制**：拦截通过审核的 Blueprint，利用 `Promise.all` 瞬间克隆底层的特工大脑并发执行，并汇总所有返回结果。

### 2. 执行簇：三局特工 (The Pods)
负责执行具体的战术动作，拥有“动态水平扩容”特性，支持按需克隆自身，并在执行结束后被内存瞬间销毁 (Serverless)。

*   **🦅 Alpha 情报局 (缇骑 / 不良人 / 苍鹰)**
    *   **文学设定**：无孔不入的皇家暗探，专司外部刺探。
    *   **可用工具**：`WebSearchTool` (全网检索), `ReadUrlTool` (网页原文精读), `TimeTool` (全球时区刻度)。
*   **🧮 Beta 量化局 (算学博士 / 司库 / 神机)**
    *   **文学设定**：冰冷理性的皇家精算师与国库总管。
    *   **可用工具**：`BashTool` (本地沙盒代码执行), `FileWriterTool` (公文自动归档), `TimeTool` (全球时区刻度)。
*   **⚖️ Gamma 风控局 (廷尉 / 御史 / 言官)**
    *   **文学设定**：令人胆寒的言官与纠弹使，专职唱反调与调阅历史旧账。
    *   **可用工具**：`WebSearchTool` (外部负面排查), `ReadUrlTool`, `MemoryTool` (持久化记忆突触，检索与固化历史教训)。

## ✨ 架构亮点
- **动态水平扩容 (Spawn-on-Demand)**：当规划出多个同职能动作时，中枢会自动克隆多个独立的大脑实例并发执行，用完即触发 V8 垃圾回收，零内存泄漏。
- **古典官僚赋名**：底层并发进程会自动分配“不良人/缇骑/算学博士”等文化代号。
- **纯正 TypeScript 工具链**：拒绝脆弱的 Prompt Skills，全部能力皆基于 `@mariozechner/pi-agent-core` 的原生强类型 TypeBox 封装。
- **多行并发大屏 (TUI)**：极简的终端多光标控制台，实时监控所有神经簇的并发推演进度。

## 🚀 安装与启动
```bash
# 1. 安装依赖
npm install

# 2. 配置密钥 (参考 .env.example)
cp .env.example .env
# 填入 MINIMAX_CN_API_KEY 和 TAVILY_API_KEY

# 3. 启动引擎
npm start
```

## 🛠 技术基座 (Technical Foundation)
本系统秉持“极简主义与不造轮子”的开发哲学，构建于以下坚实的技术基座之上：
- **核心引擎**: 基于 **[pi-mono](https://github.com/badlogic/pi-mono)** 的 `@mariozechner/pi-agent-core` 进行了深度的事件机制解耦与多 Agent 并发重构。
- **大模型接入**: 通过 `@mariozechner/pi-ai` 抹平了各大厂商 API 差异，原生支持 **MiniMax-M2.7**, **DeepSeek**, **Qwen** 等国内顶尖模型。
- **搜索能力**: 接入 **Tavily API**，专为大模型打造的极速干净网页提取与聚合搜索引擎。
- **强类型校验**: 使用 `@sinclair/typebox` 构建严格的输入/输出 Schema，杜绝大模型在复杂任务中的数据幻觉。
- **终端美学**: 利用原生 Node.js `readline` 结合 `chalk`，打造出流畅无闪烁的多并发赛博大屏。

## 🗺️ 技术路线 (Roadmap)
- [x] **Phase 1: 概念验证与单向数据流** - 确立 Oracle -> Aegis -> Nexus 的三核状态机拓扑。
- [x] **Phase 2: 纯原生技能实装** - 抛弃基于 Prompt 的脆弱技能，全面用 TypeScript 重写 WebSearch, Bash, ReadUrl 等底层工具。
- [x] **Phase 3: 动态水平并发机制** - 实现 `Promise.all` 控制下的底层 Agent 按需克隆与 TUI 多行实时看板。
- [ ] **Phase 4: 长效记忆融合 (Ongoing)** - 在系统启动时自动读取 `cyber_memory.json`，将其注回 Oracle 上下文，实现系统“防踩坑”与进化。
- [ ] **Phase 5: 微信/Web 接入层** - 剥离 CLI 终端依赖，将 TUI 进度条重构为 WebSocket 事件流，为开发跨端 UI（如接入微信群或极简 Web 面板）铺平道路。

## 🙏 致谢 (Acknowledgements)
- 感谢 **[Mario Zechner (@badlogic)](https://github.com/badlogic)** 开源的 `pi-mono` 项目，其精妙优雅的底层 Agent Loop 与 Provider 抽象层，为本作免去了极大的底层通信开销。
- 本项目架构设计灵感来源于 **Stafford Beer** 在 1970 年代为智利政府设计的 **Project Cybersyn** (赛博协同控制工程)，以及中国古代极具智慧的**“言官/保民官”监察封驳制度**。
