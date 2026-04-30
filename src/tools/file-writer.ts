import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import fs from "fs/promises";
import path from "path";

const FileWriterParams = Type.Object({
    filename: Type.String({ description: "The name of the file to save, e.g., 'report_2024.md'" }),
    content: Type.String({ description: "The complete markdown or text content to save" })
});
type FileWriterArgs = Static<typeof FileWriterParams>;

// 遵循 User Global 配置中的默认路径
const DEFAULT_SAVE_DIR = "/Users/shiyunyang/Gemini_Generated_Docs/CyberVSM";

export const fileWriterTool: AgentTool<typeof FileWriterParams> = {
    name: "write_file",
    label: "Local File Writer",
    description: "Write content to a local markdown or text file for archiving. The file will be saved in the system's official generated documents directory.",
    parameters: FileWriterParams,
    execute: async (toolCallId: string, params: FileWriterArgs) => {
        try {
            await fs.mkdir(DEFAULT_SAVE_DIR, { recursive: true });
            
            // 确保文件名安全
            const safeName = params.filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filepath = path.join(DEFAULT_SAVE_DIR, safeName);
            
            await fs.writeFile(filepath, params.content, 'utf8');
            
            return {
                content: [{ type: "text", text: `[SYSTEM] 文件已成功保存至归档库: ${filepath}` }],
                details: {}
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `[SYSTEM] 保存文件失败: ${error.message}` }],
                details: { error: true }
            };
        }
    }
};
