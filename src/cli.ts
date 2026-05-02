import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Orchestrator } from "./orchestrator.js";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";
import chalk from "chalk";

/**
 * Cyber-VSM CLI 入口文件
 * 负责读取环境变量、初始化模型驱动、接收用户意图并启动协调器。
 */
async function main() {
    console.clear();
    console.log(`
======================================================
  🏛️  Cyber-VSM (赛博决策引擎) - Alpha v1.0
  [神谕核] 规划 | [神盾核] 封驳 | [枢纽核] 调度
======================================================
`);

    // 默认使用 pi-mono 原生支持的 minimax-cn:MiniMax-M2.7
    let targetProvider = "minimax-cn";
    let targetModelId = "MiniMax-M2.7";
    let apiKey = getEnvApiKey("minimax-cn");

    // 如果没有配置 MiniMax，回退检查其他提供商
    if (!apiKey) {
        if (process.env.DEEPSEEK_API_KEY) {
            targetProvider = "deepseek";
            targetModelId = "deepseek-chat";
            apiKey = process.env.DEEPSEEK_API_KEY;
        } else if (process.env.QWEN_API_KEY) {
            targetProvider = "qwen";
            targetModelId = "qwen-max";
            apiKey = process.env.QWEN_API_KEY;
        }
    }

    if (!apiKey) {
        console.error("❌ 严重错误: 未检测到 API_KEY。请检查项目根目录的 .env 文件配置！");
        process.exit(1);
    }

    console.log(`🔌 [SYSTEM] 正在通过 pi-mono 连接大模型神经节点: ${targetProvider} / ${targetModelId}...`);

    // 直接通过 pi-mono 内置的模型注册表获取模型
    // pi-mono 已经把厂商API差异（如MiniMax走的其实是Anthropic兼容接口）完全抹平了
    const model = getModel(targetProvider as any, targetModelId as any);
    
    if (!model) {
        console.error(`❌ 严重错误: pi-mono 不支持该模型 ${targetProvider} / ${targetModelId}`);
        process.exit(1);
    }

    const orchestrator = new Orchestrator(model, apiKey);

    // 3. 启动交互式 CLI
    const rl = readline.createInterface({ input, output });

    console.log(`✅ [SYSTEM] 神经连接完毕。陛下，请问有何国事需要裁决？(输入 'exit' 退出)\n`);

    while (true) {
        const intent = await rl.question(">> ");
        
        if (intent.trim().toLowerCase() === "exit") {
            console.log("\n[SYSTEM] 系统关闭。退朝。");
            break;
        }

        if (!intent.trim()) continue;

        try {
            // 启动核心决策循环！
            const finalReport = await orchestrator.runDecisionLoop(intent);
            
            console.log(`\n==============================================`);
            console.log(`📜 [最终决策奏折]`);
            console.log(`==============================================`);
            const summary = finalReport.executiveSummary || (finalReport as any).summary || "未生成有效摘要";
            console.log(`💡 核心摘要: \n   ${summary}\n`);
            
            console.log(`📊 底层情报汇编:`);
            finalReport.podResults.forEach(r => {
                const icon = r.assignee === "alpha_scout" ? "🕵️ 情报" : 
                             r.assignee === "beta_quant" ? "🧮 数据" : "⚖️ 风控";
                console.log(`   - [${icon}]: ${r.output}`);
            });
            
            console.log(`\n🎯 枢纽核建议动作 (锦囊三策):`);
            if (finalReport.recommendedActions && finalReport.recommendedActions.length > 0) {
                finalReport.recommendedActions.forEach((action, idx) => {
                    console.log(`   [策${idx + 1}] ${chalk.cyan(action.title)}`);
                    console.log(`         ${chalk.gray.italic(action.description)}`);
                });
            } else {
                console.log(`   [提示] 未生成明确的行动建议。`);
            }
            console.log(`==============================================\n`);

        } catch (e) {
            console.error(`\n❌ [SYSTEM ERROR] 系统运转崩溃:`, e);
        }
    }

    rl.close();
}

main().catch(console.error);
