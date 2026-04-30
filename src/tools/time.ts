import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

const TimeParams = Type.Object({});
type TimeArgs = Static<typeof TimeParams>;

export const timeTool: AgentTool<typeof TimeParams> = {
    name: "get_current_time",
    label: "Global Time Service",
    description: "Get the current real-world time across major global timezones (Beijing, New York, London, Europe). Crucial for time-sensitive or financial decisions.",
    parameters: TimeParams,
    execute: async (toolCallId: string, params: TimeArgs) => {
        const now = new Date();
        
        const formatTz = (tz: string) => {
            return new Intl.DateTimeFormat('zh-CN', {
                timeZone: tz,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            }).format(now);
        };

        const timeReport = `
=== 全球核心时区时间 ===
[北京 / 亚洲] : ${formatTz('Asia/Shanghai')}
[纽约 / 美东] : ${formatTz('America/New_York')}
[伦敦 / 格林威治]: ${formatTz('Europe/London')}
[欧洲 / 巴黎] : ${formatTz('Europe/Paris')}
========================
`.trim();

        return {
            content: [{ type: "text", text: timeReport }],
            details: {}
        };
    }
};
