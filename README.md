# 🏛️ Cyber-VSM (赛博朝廷决策引擎)

基于 **古典官僚制 (唐代监察体系)** 与 **现代控制论 (Stafford Beer's VSM)** 深度缝合的极简多智能体并发调度框架。

## 📜 项目定位
这不是一个供人闲聊的 Chatbot，而是一台**无情的国家机器**。
用户扮演“最高决策者”，输入一个宏大而复杂的意图，系统将自动进行：
1. **神谕核 (Oracle)**：意图拆解与战略规划。
2. **神盾核 (Aegis)**：硬核红线审查（基于古罗马保民官一票否决权 Veto）。
3. **枢纽核 (Nexus)**：路由派发与并发调度（动态水平扩容）。

最终，系统会为你呈递一份带有多维审计依据的【决策奏折】，你只需进行最终拍板（APPROVE / REJECT / REQUIRE_MORE_INFO）。

## ⚙️ 核心特性
- **动态水平扩容 (Serverless Spawn)**：根据任务复杂度，自动克隆多个底层特工并发执行，用完即毁，零内存泄漏。
- **古典官僚赋名**：底层并发进程会自动生成“不良人/缇骑/算学博士”等代号，拉满赛博廷议的史诗感。
- **纯正 TypeScript 工具链**：拒绝脆弱的 Prompt Skills，全部能力（搜网、网页精读、执行代码、持久化记忆）皆基于 `@mariozechner/pi-agent-core` 的原生强类型封装。
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

## 🛠 技术底座
- **Core**: `@mariozechner/pi-agent-core`
- **TUI**: `ora`, `chalk`, `readline`
- **Type Safety**: `@sinclair/typebox`
