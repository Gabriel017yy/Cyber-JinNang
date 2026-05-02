/**
 * 赛博国家决策引擎 (Cyber-VSM) 核心数据结构定义
 * 
 * 依据极简控制论哲学设计。所有的通信都是基于强类型的数据接口，
 * Agent 之间不存在随意的自然语言对话。
 */

// ============================================================================
// 1. 核心流转结构：Blueprint (执行蓝图)
// 由 System 4 (Oracle) 生成，向下流转给 System 3 (Aegis) 进行审核
// ============================================================================

export interface Blueprint {
    /** 唯一蓝图追踪ID，用于审计 */
    id: string;
    
    /** 用户原始意图的凝练摘要 */
    intentSummary: string;
    
    /** 
     * 拆解后的具体执行任务列表。
     * Nexus 将根据这些任务分配给底层的 Pods。
     */
    tasks: ActuatorTask[];
    
    /** 预期输出成果（告诉 Nexus 最终要生成什么样的决策奏折） */
    expectedOutcome: string;
    
    /** 创建时间戳 */
    createdAt: number;
}

// ============================================================================
// 2. 底层执行结构：ActuatorTask (具体执行任务)
// ============================================================================

/** 定义执行簇 (System 1) 的类型 */
export type PodType = 
    | "alpha_scout"    // 情报探测 (Web, 查档)
    | "beta_quant"     // 量化演算 (算力, 收益)
    | "gamma_advocate"; // 红蓝对抗 (找漏洞, 风控推演)

export interface ActuatorTask {
    /** 任务ID */
    taskId: string;
    
    /** 指定该任务由哪个 Pod 执行 */
    assignee: PodType;
    
    /** 具体的执行指令（喂给 Pod 的 Prompt） */
    instruction: string;
    
    /** 该任务是否必须依赖其他任务先完成（为空代表可完全并行） */
    dependsOn?: string[];
}

// ============================================================================
// 3. 封驳控制结构：AegisReview (神盾审核结果)
// 由 System 3 (Aegis) 生成，控制蓝图是进入执行阶段，还是打回重做
// ============================================================================

export interface AegisReview {
    /** 审核状态：通过 / 封驳(一票否决) */
    status: "APPROVED" | "VETOED";
    
    /** 
     * 如果是被封驳，必须提供强有力的驳回理由。
     * 这个理由将被注入回 Oracle 的上下文中强制重构蓝图。
     */
    rejectReason?: string;
    
    /** 审核时间戳 */
    reviewedAt: number;
}

// ============================================================================
// 4. 汇总输出结构：DecisionReport (决策奏折)
// 由 System 2 (Nexus) 汇总所有 Pods 的执行结果后生成，呈递给 User
// ============================================================================

export interface TaskResult {
    taskId: string;
    assignee: PodType;
    /** Pod 跑出来的原始数据或分析结果 */
    output: string;
    /** 发生网络或底层故障时的 Soft Error，不引发崩溃 */
    softError?: string; 
}

export interface ActionGuideline {
    /** (中文) 行动方针简述，如 "立即平仓" / "启动对冲" / "静观其变" */
    title: string;
    /** (中文) 具体执行建议与深层依据 */
    description: string;
}

export interface DecisionReport {
    /** 对应的蓝图ID */
    blueprintId: string;
    
    /** 给 User 看的高级决策摘要 */
    executiveSummary: string;
    
    /** 三个视角（情报、数据、风险）的详细结论汇总 */
    podResults: TaskResult[];
    
    /** 供 User 参考的具体行动指南（上中下三策） */
    recommendedActions: ActionGuideline[];
}
