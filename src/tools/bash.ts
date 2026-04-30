import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const BashParameters = Type.Object({
    command: Type.String({ description: "要在终端中执行的 Bash 命令" })
});

type BashArgs = Static<typeof BashParameters>;

/**
 * 原生 Bash 执行工具
 * 赋予 Agent 在本地系统执行命令的能力。仅限授信的执行舱 (Pod) 使用！
 */
export const bashTool: AgentTool<typeof BashParameters> = {
    name: "bash",
    label: "Bash Executor",
    description: "在当前系统中执行一条 Bash 命令。如果需要计算、运行脚本、查看系统状态，请使用此工具。",
    parameters: BashParameters,
    
    execute: async (toolCallId: string, params: BashArgs, signal?: AbortSignal) => {
        try {
            // 执行命令并等待结果
            const { stdout, stderr } = await execAsync(params.command, { timeout: 10000 });
            
            let resultText = "";
            if (stdout) resultText += `STDOUT:\n${stdout}\n`;
            if (stderr) resultText += `STDERR:\n${stderr}\n`;
            
            if (!resultText) {
                resultText = "命令执行成功，但没有输出。";
            }

            return {
                content: [{ type: "text", text: resultText }],
                details: { stdout, stderr }
            };

        } catch (error: any) {
            // 包含 stdout 和 stderr 以便于排错
            let errOutput = error.message;
            if (error.stdout) errOutput += `\nSTDOUT: ${error.stdout}`;
            if (error.stderr) errOutput += `\nSTDERR: ${error.stderr}`;

            return {
                content: [{ type: "text", text: `执行失败:\n${errOutput}` }],
                details: { error: true, code: error.code }
            };
        }
    }
};
