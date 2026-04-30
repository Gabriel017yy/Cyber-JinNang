import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import fs from "fs/promises";
import path from "path";

const MemoryParams = Type.Object({
    action: Type.Union([Type.Literal("save"), Type.Literal("search")]),
    key: Type.String({ description: "The topic or keyword, e.g., 'us_china_policy_assessment'" }),
    value: Type.Optional(Type.String({ description: "The detailed content to save (required if action is 'save')" }))
});
type MemoryArgs = Static<typeof MemoryParams>;

const MEMORY_FILE = path.join(process.cwd(), "data", "cyber_memory.json");

export const memoryTool: AgentTool<typeof MemoryParams> = {
    name: "manage_memory",
    label: "Cyber Memory Bank",
    description: "A persistent Key-Value memory system for the agents to store and retrieve strategic judgments, past decisions, or important context across sessions.",
    parameters: MemoryParams,
    execute: async (toolCallId: string, params: MemoryArgs) => {
        try {
            await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
            
            let memoryData: Record<string, string> = {};
            try {
                const raw = await fs.readFile(MEMORY_FILE, 'utf8');
                memoryData = JSON.parse(raw);
            } catch (e) {
                // 文件不存在或损坏则初始化为空
            }

            if (params.action === "save") {
                if (!params.value) throw new Error("Missing 'value' for save action.");
                memoryData[params.key] = params.value;
                await fs.writeFile(MEMORY_FILE, JSON.stringify(memoryData, null, 2), 'utf8');
                return {
                    content: [{ type: "text", text: `[SYSTEM] 记忆已固化: ${params.key}` }],
                    details: {}
                };
            } else {
                // Search
                // 简单的模糊匹配
                const results = Object.entries(memoryData)
                    .filter(([k]) => k.toLowerCase().includes(params.key.toLowerCase()))
                    .map(([k, v]) => `[Key: ${k}]\n${v}\n`);
                
                if (results.length > 0) {
                    return {
                        content: [{ type: "text", text: `=== 提取到的神经突触记忆 ===\n${results.join('\n')}` }],
                        details: {}
                    };
                } else {
                    return {
                        content: [{ type: "text", text: `[SYSTEM] 记忆库中未找到与 '${params.key}' 相关的记录。` }],
                        details: {}
                    };
                }
            }
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `[SYSTEM] 记忆突触访问失败: ${error.message}` }],
                details: { error: true }
            };
        }
    }
};
