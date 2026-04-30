import { Agent } from "@mariozechner/pi-agent-core";
import { type Model } from "@mariozechner/pi-ai";
import chalk from "chalk";
import { ORACLE_SYSTEM_PROMPT } from "./prompts/oracle.js";
import { AEGIS_SYSTEM_PROMPT } from "./prompts/aegis.js";
import { NEXUS_SYSTEM_PROMPT } from "./prompts/nexus.js";
import { dispatchTaskToPod } from "./pods/index.js";
import type { Blueprint, AegisReview, DecisionReport, TaskResult } from "./types.js";

/**
 * 赛博协调器 (Cyber-Orchestrator)
 */
export class Orchestrator {
    private oracle: Agent;
    private aegis: Agent;
    private nexus: Agent;
    private model: Model<any>;
    private apiKey?: string;

    constructor(model: Model<any>, apiKey?: string) {
        this.model = model;
        this.apiKey = apiKey;
        /**
         * 基于 pi-mono 的设计模式：
         * 我们通过注入 Model 对象和 API Key 来初始化 Agent。
         * 这使得我们可以无缝切换 DeepSeek, Qwen, MiniMax 等不同厂商，
         * 而不需要改动核心业务逻辑。
         */
        const agentOptions = {
            initialState: { model },
            getApiKey: () => apiKey // 从外部注入或从环境变量读取
        };

        this.oracle = new Agent({ 
            ...agentOptions, 
            initialState: { ...agentOptions.initialState, systemPrompt: ORACLE_SYSTEM_PROMPT } 
        });
        
        this.aegis = new Agent({ 
            ...agentOptions, 
            initialState: { ...agentOptions.initialState, systemPrompt: AEGIS_SYSTEM_PROMPT } 
        });
        
        this.nexus = new Agent({ 
            ...agentOptions, 
            initialState: { ...agentOptions.initialState, systemPrompt: NEXUS_SYSTEM_PROMPT } 
        });
    }

    /**
     * 辅助方法：给长时间运行的异步任务加上倒计时进度条
     */
    private async withTimer<T>(prefix: string, task: () => Promise<T>): Promise<T> {
        let seconds = 0;
        process.stdout.write(prefix);
        
        const timer = setInterval(() => {
            seconds++;
            // \r 回到行首，\x1b[K 清除当前行剩余内容
            process.stdout.write(`\r\x1b[K${prefix} [${seconds}s]...`);
        }, 1000);

        try {
            const result = await task();
            process.stdout.write(`\r\x1b[K${prefix} [${seconds}s] ✅ 完成！\n`);
            return result;
        } finally {
            clearInterval(timer);
        }
    }

    /**
     * 核心流转循环 (逻辑保持不变，体现了 Provider 抹平的威力)
     */
    public async runDecisionLoop(intent: string): Promise<DecisionReport> {
        console.log(`\n[SYSTEM] 正在使用模型: ${this.oracle.state.model.id} (${this.oracle.state.model.provider})`);
        console.log(`[USER] 意图: ${intent}\n`);
        
        let approved = false;
        let finalBlueprint: Blueprint | null = null;
        let currentPrompt = `用户意图如下，请生成严格的 JSON 执行蓝图:\n${intent}`;

        while (!approved) {
            // --- Oracle 阶段 ---
            await this.withTimer(`[神谕核 🧠] 正在深度规划决策蓝图`, async () => {
                await this.oracle.prompt(currentPrompt);
                await this.oracle.waitForIdle();
            });
            
            const blueprintText = this.getLastAssistantMessage(this.oracle);
            const blueprint = this.parseJsonSafely<Blueprint>(blueprintText);
            
            if (!blueprint) {
                console.log(`\n[SYSTEM ⚠️] Oracle 输出了不合法的 JSON，触发强制重试机制...`);
                // console.log(`[Debug] 原始输出: ${blueprintText}`);
                currentPrompt = "你刚才的输出格式不符合要求。请不要输出任何多余的解释，严格返回合法的 JSON 格式。";
                continue; 
            }

            // --- Aegis 阶段 ---
            await this.withTimer(`[神盾核 🛡️] 正在严格审计蓝图漏洞`, async () => {
                await this.aegis.prompt(`请审查蓝图：\n${JSON.stringify(blueprint)}`);
                await this.aegis.waitForIdle();
            });
            
            const reviewText = this.getLastAssistantMessage(this.aegis);
            const review = this.parseJsonSafely<AegisReview>(reviewText);

            if (review?.status === "VETOED") {
                console.log(`[VETO 🛡️] ${review.rejectReason}`);
                currentPrompt = `驳回理由: ${review.rejectReason}`;
            } else if (review?.status === "APPROVED") {
                console.log(`[APPROVED ✅] 审计通过。`);
                approved = true;
                finalBlueprint = blueprint;
            }
        }

        // --- 执行阶段 (Pods) ---
        console.log(`\n[执行簇 ⚙️] 审计通过！六部打工人已接管大模型神经，开始并发执行任务...`);
        
        // 美化：打印分发的指令（灰色斜体），明确这是输入而不是输出
        finalBlueprint!.tasks.forEach(task => {
            const podIcon = task.assignee.includes('alpha') ? '🕵️' : task.assignee.includes('beta') ? '🧮' : '⚖️';
            const podName = task.assignee.replace('_scout', '').replace('_quant', '').replace('_advocate', '').toUpperCase();
            console.log(`  📥 派发给 [Pod ${podName} ${podIcon}]:\n${chalk.dim.italic('     "' + task.instruction + '"')}\n`);
        });

        // 并发派发任务给各个执行舱
        const podResults: TaskResult[] = await Promise.all(
            finalBlueprint!.tasks.map(task => dispatchTaskToPod(task, this.model, this.apiKey))
        );

        // --- Nexus 汇总阶段 ---
        let report: DecisionReport | null = null;
        let nexusPrompt = `蓝图：${JSON.stringify(finalBlueprint)}\n结果：${JSON.stringify(podResults)}`;

        while (!report) {
            await this.withTimer(`[枢纽核 📜] 正在汇总情报并起草最终奏折`, async () => {
                await this.nexus.prompt(nexusPrompt);
                await this.nexus.waitForIdle();
            });
            
            const reportText = this.getLastAssistantMessage(this.nexus);
            report = this.parseJsonSafely<DecisionReport>(reportText);

            if (!report) {
                console.log(`\n[SYSTEM ⚠️] Nexus 输出了不合法的 JSON，触发强制重试机制...`);
                // 让大模型意识到自己格式错了，重新输出
                nexusPrompt = "你刚才的输出格式不符合要求。请不要输出任何多余的解释，严格返回合法的 JSON 格式。";
            }
        }
        
        return report;
    }

    private getLastAssistantMessage(agent: Agent): string {
        const lastMsg = agent.state.messages[agent.state.messages.length - 1];
        if (lastMsg?.role === "assistant") {
            const textContent = lastMsg.content.find(c => c.type === "text");
            return textContent && "text" in textContent ? textContent.text : "";
        }
        return "";
    }

    private parseJsonSafely<T>(text: string): T | null {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
        } catch (e) {
            return null;
        }
    }
}
