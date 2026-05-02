import { Agent, type AgentTool } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";
import type { ActuatorTask, TaskResult } from "../types.js";
import { POD_ALPHA_PROMPT, POD_BETA_PROMPT, POD_GAMMA_PROMPT } from "../prompts/pods.js";
import { webSearchTool, bashTool, fileWriterTool, timeTool, readUrlTool, memoryTool } from "../tools/index.js";
import chalk from "chalk";
import readline from "readline";

// ==========================================
// 赛博指挥大屏 (Terminal Dashboard)
// ==========================================
class Dashboard {
    private states = new Map<string, string>();
    private linesPrinted = 0;
    
    update(id: string, text: string) {
        this.states.set(id, text);
        this.render();
    }
    
    remove(id: string) {
        this.states.delete(id);
        this.render();
    }
    
    private render() {
        // 清除之前打印的行
        if (this.linesPrinted > 0) {
            readline.moveCursor(process.stdout, 0, -this.linesPrinted);
            readline.clearScreenDown(process.stdout);
        }
        
        let output = "";
        let lineCount = 0;
        this.states.forEach((text) => {
            output += text + "\n";
            lineCount += text.split("\n").length;
        });
        
        if (output) {
            process.stdout.write(output);
            this.linesPrinted = lineCount;
        } else {
            this.linesPrinted = 0;
        }
    }
}

const dashboard = new Dashboard();

// ==========================================
// 代号生成器 (Local Naming)
// ==========================================
const ALPHA_NAMES = ["不良人", "缇骑", "游隼", "夜鸢", "苍鹰"];
const BETA_NAMES = ["算学博士", "天算", "神机", "铁算盘", "司库"];
const GAMMA_NAMES = ["御史", "廷尉", "言官", "纠弹使", "提刑"];

function getRandomName(names: string[]): string {
    return names[Math.floor(Math.random() * names.length)];
}

/**
 * 赛博执行舱 (Actuators / The Pods / System 1)
 * 
 * 现在它们已经是真正有脑子的 AI 代理了！
 */

function createPodAgent(model: Model<any>, apiKey: string | undefined, systemPrompt: string, tools: AgentTool[] = [], podName: string): Agent {
    const agent = new Agent({
        initialState: { model, systemPrompt, tools },
        getApiKey: () => apiKey
    });

    let streamText = "等待神经信号...";
    
    // 订阅事件并推送到 Dashboard
    agent.subscribe((event) => {
        const updateLine = (statusText: string, icon = "⚡️", color = chalk.cyan) => {
            // 终端折行会导致 Dashboard 的 moveCursor 计算失效，出现无限刷屏。
            // 因为中文字符占2个宽度，为了适配 80 列宽的终端，这里严格限制最大字符数为 25。
            const MAX_CHARS = 25;
            const displayStream = streamText.length > MAX_CHARS 
                ? "..." + streamText.substring(streamText.length - (MAX_CHARS - 3)) 
                : streamText;
            dashboard.update(podName, `${color(`[${icon} ${podName}]`)} ${color.bold(statusText)}\n   ↳ 💭 ${chalk.gray.italic(displayStream)}`);
        };

        if (event.type === "agent_start") {
            updateLine("神经突触已连接，正在思考...");
        } else if (event.type === "tool_execution_start") {
            streamText = `[Tool: ${event.toolName}] 正在与外部世界握手...`;
            updateLine("正在调用外部工具...", "⚙️", chalk.magenta);
        } else if (event.type === "tool_execution_end") {
            streamText = "工具调用返回，正在吸收情报...";
            updateLine("工具执行完毕，正在进行总结...");
        } else if (event.type === "message_update") {
            // 捕获大模型的实时输出流
            if (event.assistantMessageEvent.type === "text_start") {
                streamText = "";
            } else if (event.assistantMessageEvent.type === "text_delta") {
                const delta = (event.assistantMessageEvent as any).delta || "";
                streamText += delta.replace(/\n/g, ' ');
                updateLine("正在高频脑电波推演中...");
            }
        } else if (event.type === "agent_end") {
            const finalLength = streamText.length;
            dashboard.update(podName, `${chalk.green(`[✅ ${podName}]`)} ${chalk.green.bold("执行完成!")}\n   ↳ 📜 ${chalk.gray.italic(`最终汇编了包含 ${finalLength} 个字符的底层研报。`)}`);
        }
    });

    return agent;
}

/**
 * 提取 Agent 最新输出的文本内容
 */
function getAgentOutput(agent: Agent): string {
    if (agent.state.errorMessage) {
        return `Agent 执行异常退出: ${agent.state.errorMessage}`;
    }
    
    // 倒序查找最后一个有文字内容的 assistant 消息
    for (let i = agent.state.messages.length - 1; i >= 0; i--) {
        const msg = agent.state.messages[i];
        if (msg.role === "assistant" && msg.content) {
            // 如果 content 是字符串，强制转换为 string 避免 TS never 报错
            if (typeof msg.content === "string") {
                const textStr = msg.content as unknown as string;
                if (textStr.trim().length > 0) return textStr;
            } 
            // 如果 content 是数组，查找 text 类型的块
            else if (Array.isArray(msg.content)) {
                const textContent = msg.content.find(c => c.type === "text" && "text" in c && c.text.trim().length > 0);
                if (textContent && "text" in textContent) {
                    return textContent.text;
                }
            }
        }
    }
    return "无输出（可能只进行了工具调用而未生成最终总结）";
}

/**
 * Pod Alpha: 情报探测者 (The Scout)
 */
export async function runPodAlpha(task: ActuatorTask, model: Model<any>, apiKey?: string): Promise<TaskResult> {
    const podName = `Alpha-${getRandomName(ALPHA_NAMES)}-${Math.floor(Math.random() * 100)}`;
    const agent = createPodAgent(model, apiKey, POD_ALPHA_PROMPT, [webSearchTool as any, readUrlTool as any, timeTool as any], podName);
    await agent.prompt(task.instruction);
    await agent.waitForIdle();
    
    return {
        taskId: task.taskId,
        assignee: "alpha_scout",
        output: getAgentOutput(agent),
    };
}

/**
 * Pod Beta: 量化演算者 (The Quant)
 */
export async function runPodBeta(task: ActuatorTask, model: Model<any>, apiKey?: string): Promise<TaskResult> {
    const podName = `Beta-${getRandomName(BETA_NAMES)}-${Math.floor(Math.random() * 100)}`;
    const agent = createPodAgent(model, apiKey, POD_BETA_PROMPT, [bashTool as any, fileWriterTool as any, timeTool as any], podName);
    await agent.prompt(task.instruction);
    await agent.waitForIdle();

    return {
        taskId: task.taskId,
        assignee: "beta_quant",
        output: getAgentOutput(agent),
    };
}

/**
 * Pod Gamma: 红蓝对抗者 (The Devil's Advocate)
 */
export async function runPodGamma(task: ActuatorTask, model: Model<any>, apiKey?: string): Promise<TaskResult> {
    const podName = `Gamma-${getRandomName(GAMMA_NAMES)}-${Math.floor(Math.random() * 100)}`;
    const agent = createPodAgent(model, apiKey, POD_GAMMA_PROMPT, [webSearchTool as any, readUrlTool as any, memoryTool as any], podName);
    await agent.prompt(task.instruction);
    await agent.waitForIdle();

    return {
        taskId: task.taskId,
        assignee: "gamma_advocate",
        output: getAgentOutput(agent),
    };
}

/**
 * 统一调度接口
 */
export async function dispatchTaskToPod(task: ActuatorTask, model: Model<any>, apiKey?: string): Promise<TaskResult> {
    try {
        switch (task.assignee) {
            case "alpha_scout":
                return await runPodAlpha(task, model, apiKey);
            case "beta_quant":
                return await runPodBeta(task, model, apiKey);
            case "gamma_advocate":
                return await runPodGamma(task, model, apiKey);
            default:
                throw new Error(`未知的执行舱分配: ${task.assignee}`);
        }
    } catch (e) {
        // 软错误隔离：任何底层执行崩溃，都不能崩掉系统，而是作为 softError 返回
        return {
            taskId: task.taskId,
            assignee: task.assignee,
            output: "执行失败",
            softError: e instanceof Error ? e.message : String(e)
        };
    }
}
