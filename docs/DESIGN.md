# 朝廷 Agent — 整体方案设计

_版本：v0.1 | 2026-04-28_

---

## 一、核心理念

用户是**皇上**，输入一个复杂决策问题。整套系统像唐朝国家机器一样自动运转，最终输出一份格式化「奏折」，皇上只需三个动作：**准奏 / 驳回 / 追问**。

系统的核心价值不是生成报告，而是：
1. **决策路径可审计**：每个 Agent 的推理过程都记录在案
2. **内置制衡**：门下省可以封驳中书省的方案，强迫重新规划
3. **并行执行**：六部同时工作，最后汇总

---

## 二、Agent 架构

### 流水线总览

```
皇上（用户输入）
    ↓
[太子] 问题分拣 & 意图识别
    ↓
[中书省] 制定执行方案（Plan）
    ↓
[门下省] 审核 & 封驳（可打回中书省重做，最多 2 轮）
    ↓
[尚书省] 拆解任务 → 分派六部
    ↓
[六部] 并行执行（各司其职）
    ↓
[奏折生成] 汇总 → 格式化输出
    ↓
皇上拍板（准奏 / 驳回 / 追问）
```

### 各 Agent 职责

| Agent | 身份 | 职责 | 输出 |
|-------|------|------|------|
| 太子 | 分拣官 | 识别问题类型、提取关键实体、判断是否需要信息检索 | `IntentPlan` |
| 中书省 | 规划者 | 基于意图制定 step-by-step 执行计划 | `ExecutionPlan` |
| 门下省 | 审核者 | 检查计划的合理性、完整性，可封驳并说明理由 | `ReviewResult` |
| 尚书省 | 调度者 | 将计划拆解为具体任务分派给六部 | `TaskList` |
| 吏部 | HR | 人事、评价、个人职业分析类任务 | `Memorial` |
| 户部 | 财务 | 财务、预算、成本分析类任务 | `Memorial` |
| 礼部 | 礼仪 | 表达、沟通、方案包装类任务 | `Memorial` |
| 兵部 | 战略 | 竞争分析、风险评估类任务 | `Memorial` |
| 刑部 | 法律 | 合规、风险、负面影响评估类任务 | `Memorial` |
| 工部 | 执行 | 信息检索、数据收集、实施细节类任务 | `Memorial` |

> 六部不一定全部激活，尚书省根据任务类型选择激活哪几部。

---

## 三、数据结构

```typescript
// 太子输出
interface IntentPlan {
  summary: string;          // 问题一句话摘要
  type: "decision" | "analysis" | "planning" | "research";
  entities: string[];       // 关键实体
  needsSearch: boolean;     // 是否需要联网检索
}

// 中书省输出
interface ExecutionPlan {
  steps: string[];          // 执行步骤列表
  ministries: Ministry[];   // 需要激活的部门
  rationale: string;        // 规划理由
}

// 门下省输出
interface ReviewResult {
  approved: boolean;
  issues?: string[];        // 封驳时列出问题
  revision?: string;        // 修改建议
}

// 六部输出（奏折片段）
interface Memorial {
  ministry: string;
  findings: string;
  recommendation: string;
  confidence: "high" | "medium" | "low";
}

// 最终奏折
interface ImperialMemorial {
  question: string;
  summary: string;
  memorials: Memorial[];
  auditTrail: AuditEntry[]; // 完整审计路径
  decision?: "approved" | "rejected" | "inquiry";
}
```

---

## 四、技术实现

### 技术栈

| 层级 | 技术 |
|------|------|
| LLM 接口 | `@mariozechner/pi-ai` v0.70.2 |
| Agent Loop | `@mariozechner/pi-agent-core` v0.70.2（本地 workspace 引用）|
| 运行时 | TypeScript + Node.js |
| CLI | `commander` 或原生 `process.argv` |
| 并行执行 | `Promise.all()` |

### 依赖引用方式

pi-mono 以本地 workspace 形式引入，避免发布：

```json
// package.json
{
  "dependencies": {
    "@mariozechner/pi-ai": "file:../pi-mono/packages/ai",
    "@mariozechner/pi-agent-core": "file:../pi-mono/packages/agent"
  }
}
```

### 目录结构（完整）

```
chaoting-agent/
├── src/
│   ├── cli.ts                    ← 入口，处理用户输入和最终交互
│   ├── agents/
│   │   ├── taizi.ts              ← 太子（分拣）
│   │   ├── zhongshu.ts           ← 中书省（规划）
│   │   ├── menxia.ts             ← 门下省（审核）
│   │   ├── shangshu.ts           ← 尚书省（调度）
│   │   └── liubu/                ← 六部
│   │       ├── libu.ts           ← 吏部
│   │       ├── hubu.ts           ← 户部
│   │       ├── libu-li.ts        ← 礼部
│   │       ├── bingbu.ts         ← 兵部
│   │       ├── xingbu.ts         ← 刑部
│   │       └── gongbu.ts         ← 工部
│   ├── tools/
│   │   ├── search.ts             ← 联网搜索工具（NewsAPI / web）
│   │   └── memory.ts             ← 上下文记忆工具
│   ├── output/
│   │   ├── memorial.ts           ← 奏折格式化
│   │   └── audit.ts              ← 审计路径记录
│   └── types.ts                  ← 共享类型定义
├── docs/
│   └── DESIGN.md                 ← 本文件
├── my-study/
│   └── HANDOFF.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 五、开发 Phase 规划

### Phase 1 — 太子 MVP（当前目标）

**目标**：跑通最简单的单 Agent 流程，验证 pi-agent-core 调用方式。

**做什么**：
- 初始化 `package.json` + `tsconfig.json`
- 写 `types.ts`（基础类型）
- 写 `agents/taizi.ts`（只做意图识别）
- 写 `cli.ts`（接受输入，调用太子，打印结果）

**成功标准**：运行 `npx ts-node src/cli.ts "我要不要换工作"` 能得到结构化的 IntentPlan。

---

### Phase 2 — 三省接通

**目标**：中书省 + 门下省流水线，含封驳重试逻辑。

**做什么**：
- 写 `zhongshu.ts`、`menxia.ts`
- 实现封驳循环（最多 2 轮）
- 输出 ExecutionPlan

---

### Phase 3 — 六部并行

**目标**：尚书省调度 + 六部 `Promise.all()` 并行执行。

**做什么**：
- 写 `shangshu.ts` + 六部文件
- 实现动态激活（只启动相关的部）
- 汇总 Memorial

---

### Phase 4 — 皇上交互

**目标**：输出完整奏折，用户可以准奏 / 驳回 / 追问。

**做什么**：
- 写 `output/memorial.ts` 格式化输出
- 写 `output/audit.ts` 审计路径
- 实现 CLI 交互循环

---

## 六、立即行动项

1. 初始化 `package.json`（引入 pi-mono 本地依赖）
2. 初始化 `tsconfig.json`
3. 写 `src/types.ts`
4. 写 `src/agents/taizi.ts`
5. 写 `src/cli.ts` 最小化版本
