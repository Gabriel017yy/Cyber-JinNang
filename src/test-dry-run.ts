import { Orchestrator } from "./orchestrator.js";
import { registerFauxProvider, fauxAssistantMessage } from "@mariozechner/pi-ai";
import type { Blueprint, AegisReview, DecisionReport } from "./types.js";

/**
 * Cyber-VSM 引擎 Mock 测试 (Dry Run)
 * 
 * 使用 pi-mono 内部的 FauxProvider 来模拟大模型的输出。
 * 这样可以在不消耗真实 Token 的情况下，验证我们的状态机路由逻辑是否跑通。
 */

async function main() {
    console.log("🚀 [SYSTEM] 初始化测试环境...");

    // 1. 注册 Faux Provider (虚拟大模型提供商)
    const faux = registerFauxProvider({
        api: "faux-test-api",
        provider: "FauxTest",
        tokensPerSecond: 100 // 稍微给点打字机的延迟感
    });

    const model = faux.getModel();

    // 2. 准备 Mock 的 JSON 响应数据
    
    // 第一次 Oracle 生成蓝图 (故意留一个漏洞让 Aegis 封驳)
    const mockBlueprint1: Blueprint = {
        id: "bp-mock-001",
        intentSummary: "分析是否应该跳槽",
        tasks: [
            {
                taskId: "t-001",
                assignee: "alpha_scout",
                instruction: "搜索大厂目前的招聘趋势"
            }
        ],
        expectedOutcome: "一份关于跳槽的建议报告",
        createdAt: Date.now()
    };

    // 第一次 Aegis 审核 (冷酷地封驳，因为没有指派 Gamma)
    const mockAegisReview1: AegisReview = {
        status: "VETOED",
        rejectReason: "致命漏洞：没有指派 gamma_advocate 进行跳槽失败的风险推演，这可能导致用户面临失业风险。必须打回重构！",
        reviewedAt: Date.now()
    };

    // 第二次 Oracle 重写蓝图 (乖乖加上了 Gamma 和 Beta)
    const mockBlueprint2: Blueprint = {
        id: "bp-mock-002",
        intentSummary: "分析是否应该跳槽 (包含风控与量化)",
        tasks: [
            {
                taskId: "t-001",
                assignee: "alpha_scout",
                instruction: "搜索大厂目前的招聘趋势"
            },
            {
                taskId: "t-002",
                assignee: "beta_quant",
                instruction: "计算跳槽带来的薪资涨幅与沉没成本"
            },
            {
                taskId: "t-003",
                assignee: "gamma_advocate",
                instruction: "推演试用期被裁的最坏情况"
            }
        ],
        expectedOutcome: "一份包含收益与极端风险的完整跳槽分析奏折",
        createdAt: Date.now()
    };

    // 第二次 Aegis 审核 (通过)
    const mockAegisReview2: AegisReview = {
        status: "APPROVED",
        reviewedAt: Date.now()
    };

    // 最终 Nexus 汇总的奏折
    const mockDecisionReport: DecisionReport = {
        blueprintId: "bp-mock-002",
        executiveSummary: "当前大厂缩招，虽然薪资涨幅诱人，但试用期被裁风险极高。建议暂缓跳槽。",
        podResults: [
            { taskId: "t-001", assignee: "alpha_scout", output: "招聘需求同比下降 30%" },
            { taskId: "t-002", assignee: "beta_quant", output: "预期薪资涨幅可达 20%" },
            { taskId: "t-003", assignee: "gamma_advocate", output: "存在试用期因HC锁卡被直接优化的风险" }
        ],
        recommendedActions: [
            {
                title: "立即驳回",
                description: "依据 Gamma 风控局判定，此时入局存在本金归零风险，建议暂缓。"
            }
        ]
    };

    // 3. 将这些 Mock 数据依次注入到虚拟模型的“弹夹”里
    // 注意：这里的顺序必须严格匹配 Orchestrator 内部调用 prompt 的顺序
    faux.setResponses([
        fauxAssistantMessage(JSON.stringify(mockBlueprint1)), // 第1次循环：Oracle
        fauxAssistantMessage(JSON.stringify(mockAegisReview1)), // 第1次循环：Aegis
        fauxAssistantMessage(JSON.stringify(mockBlueprint2)), // 第2次循环：Oracle (重写)
        fauxAssistantMessage(JSON.stringify(mockAegisReview2)), // 第2次循环：Aegis
        fauxAssistantMessage(JSON.stringify(mockDecisionReport)) // 最终阶段：Nexus
    ]);

    // 4. 启动真实的协调器 (Orchestrator)，注入虚拟模型
    const orchestrator = new Orchestrator(model, "fake-key");

    console.log("\n🎬 [SYSTEM] 开始 Dry Run 模拟运行！\n");
    
    try {
        const finalReport = await orchestrator.runDecisionLoop("最近干得很不爽，帮我分析下现在是不是跳槽去大厂的好时机？");
        
        console.log(`\n==============================================`);
        console.log(`📜 [FINAL REPORT] 最终决策奏折`);
        console.log(`==============================================`);
        console.log(JSON.stringify(finalReport, null, 2));
        
    } catch (e) {
        console.error("运行失败:", e);
    } finally {
        // 清理注册表
        faux.unregister();
    }
}

main().catch(console.error);
