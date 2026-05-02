import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Orchestrator } from "./orchestrator.js";
import { getModel, getEnvApiKey } from "@mariozechner/pi-ai";
import chalk from "chalk";

/**
 * 赛博锦囊 (Cyber-Stratagem) CLI 入口文件
 * 负责读取环境变量、初始化模型驱动、接收用户意图并启动协调器。
 */
async function main() {
    console.clear();
    console.log(chalk.cyanBright.bold(`
======================================================
     📜  赛博锦囊 (Cyber-JinNang) - 决策启动
======================================================
`));

    const rl = readline.createInterface({ input, output });

    async function runSetup() {
        console.log(chalk.yellowBright(`\n[引导向导] 检测到未配置神经元节点或触发了重新配置指令。`));
        console.log(`请选择您要连接的大模型引擎:`);
        console.log(`  1. MiniMax (默认推荐)`);
        console.log(`  2. DeepSeek`);
        console.log(`  3. Qwen`);
        const choice = await rl.question(chalk.gray(">> 请输入序号 (默认 1): "));
        
        let envKey = "MINIMAX_CN_API_KEY";
        let providerName = "MiniMax";
        if (choice.trim() === "2") { envKey = "DEEPSEEK_API_KEY"; providerName = "DeepSeek"; }
        else if (choice.trim() === "3") { envKey = "QWEN_API_KEY"; providerName = "Qwen"; }

        const key = await rl.question(chalk.gray(`>> 请粘贴您的 ${providerName} API Key: `));
        if (!key.trim()) {
            console.log(chalk.red("配置取消。"));
            return false;
        }

        const envPath = path.join(process.cwd(), ".env");
        fs.appendFileSync(envPath, `\n${envKey}=${key.trim()}\n`);
        process.env[envKey] = key.trim();

        console.log(chalk.cyanBright(`\n[可选配置] Alpha Scout (情报探测特工) 依赖 Tavily 搜索引擎进行全网数据抓取。`));
        const tavilyKey = await rl.question(chalk.gray(`>> 请粘贴 Tavily API Key (若暂无，请直接按回车跳过): `));
        if (tavilyKey.trim()) {
            fs.appendFileSync(envPath, `TAVILY_API_KEY=${tavilyKey.trim()}\n`);
            process.env.TAVILY_API_KEY = tavilyKey.trim();
        }

        console.log(chalk.green(`✅ [系统] 神经节点配置完毕！密钥已存入本地 .env 文件。\n`));
        return true;
    }

    function initOrchestrator(): Orchestrator | null {
        let targetProvider = "minimax-cn";
        let targetModelId = "MiniMax-M2.7";
        let apiKey = getEnvApiKey("minimax-cn");

        if (!apiKey) {
            if (process.env.DEEPSEEK_API_KEY) { targetProvider = "deepseek"; targetModelId = "deepseek-chat"; apiKey = process.env.DEEPSEEK_API_KEY; }
            else if (process.env.QWEN_API_KEY) { targetProvider = "qwen"; targetModelId = "qwen-max"; apiKey = process.env.QWEN_API_KEY; }
        }

        if (!apiKey) return null;

        console.log(`🔌 [SYSTEM] 正在连接大模型神经节点: ${targetProvider} / ${targetModelId}...`);
        const model = getModel(targetProvider as any, targetModelId as any);
        if (!model) {
            console.error(`❌ 严重错误: pi-mono 不支持该模型 ${targetProvider}`);
            return null;
        }
        return new Orchestrator(model, apiKey);
    }

    let orchestrator = initOrchestrator();

    if (!orchestrator) {
        const success = await runSetup();
        if (success) orchestrator = initOrchestrator();
        if (!orchestrator) {
            console.error("❌ 未能成功初始化大模型，系统退出。");
            process.exit(1);
        }
    }

    console.log(`✅ [SYSTEM] 神经连接完毕。陛下，请问有何国事需要裁决？(输入 '/help' 查看可用指令)\n`);

    while (true) {
        const intent = await rl.question(">> ");
        const command = intent.trim().toLowerCase();
        
        if (command === "/exit" || command === "exit") {
            console.log("\n[SYSTEM] 系统关闭。退朝。");
            break;
        }
        
        if (command === "/clear") {
            console.clear();
            continue;
        }
        
        if (command === "/help") {
            console.log(chalk.gray(`\n系统指令: \n  /login - 重新配置 API Key\n  /clear - 清理屏幕\n  /exit  - 退出系统\n`));
            continue;
        }
        
        if (command === "/login") {
            await runSetup();
            const newOrch = initOrchestrator();
            if (newOrch) {
                orchestrator = newOrch;
                console.log(chalk.green(`✅ 已成功切换神经节点！\n`));
            }
            continue;
        }

        if (!intent.trim()) continue;

        try {
            // 启动核心决策循环！
            const finalReport = await orchestrator.runDecisionLoop(intent);
            
            console.log(`\n${chalk.magentaBright.bold('======================================================')}`);
            console.log(` ${chalk.bgMagenta.white.bold(' 📜 最终决策奏折 (DECISION REPORT) ')}`);
            console.log(`${chalk.magentaBright.bold('======================================================')}`);
            
            const summary = finalReport.executiveSummary || (finalReport as any).summary || "未生成有效摘要";
            console.log(`\n${chalk.yellowBright.bold('💡 核心摘要 (Executive Summary):')}`);
            console.log(`   ${chalk.whiteBright.italic(summary)}`);
            
            console.log(`\n${chalk.blueBright.bold('📊 底层情报汇编 (Pod Intelligence):')}`);
            finalReport.podResults.forEach(r => {
                let icon = "🕵️ 情报";
                let color = chalk.cyan;
                if (r.assignee === "beta_quant") { icon = "🧮 数据"; color = chalk.green; }
                if (r.assignee === "gamma_advocate") { icon = "⚖️ 风控"; color = chalk.red; }
                
                console.log(`   ${color(`[${icon}]`)} ${chalk.white(r.output)}`);
            });
            
            console.log(`\n${chalk.redBright.bold('🎯 枢纽核建议动作 (锦囊三策):')}`);
            if (finalReport.recommendedActions && finalReport.recommendedActions.length > 0) {
                finalReport.recommendedActions.forEach((action, idx) => {
                    const strategyColor = idx === 0 ? chalk.bgRedBright.white.bold : (idx === 1 ? chalk.bgYellow.black.bold : chalk.bgBlue.white.bold);
                    console.log(`   ${strategyColor(` [策${idx + 1}] `)} ${chalk.cyanBright.bold(action.title)}`);
                    console.log(`         ${chalk.gray.italic(action.description)}`);
                });
            } else {
                console.log(`   ${chalk.red.italic('[提示] 未生成明确的行动建议。')}`);
            }
            console.log(`\n${chalk.magentaBright.bold('======================================================')}\n`);

        } catch (e) {
            console.error(`\n${chalk.bgRed.white.bold(' ❌ [SYSTEM ERROR] 系统运转崩溃: ')}`, e);
        }
    }

    rl.close();
}

main().catch(console.error);
