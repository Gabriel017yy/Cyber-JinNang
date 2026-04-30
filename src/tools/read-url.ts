import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

const ReadUrlParams = Type.Object({
    url: Type.String({ description: "The full URL to fetch, e.g., 'https://example.com/article'" })
});
type ReadUrlArgs = Static<typeof ReadUrlParams>;

export const readUrlTool: AgentTool<typeof ReadUrlParams> = {
    name: "read_url",
    label: "Webpage Text Extractor",
    description: "Fetch and extract plain text content from a specific URL. Use this to read the full content of an article, paper, or report after finding its link via web search.",
    parameters: ReadUrlParams,
    execute: async (toolCallId: string, params: ReadUrlArgs) => {
        try {
            const response = await fetch(params.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: AbortSignal.timeout(15000) // 15秒超时
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            
            // 极简且稳健的 HTML 清洗逻辑 (避免依赖第三方库，保持轻量)
            // 1. 移除 script, style, svg 等不可见内容
            let text = html.replace(/<(script|style|svg|noscript|header|footer|nav)[^>]*>[\s\S]*?<\/\1>/gi, '');
            // 2. 移除所有 HTML 标签
            text = text.replace(/<[^>]+>/g, ' ');
            // 3. 解码常见的 HTML 实体
            text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            // 4. 合并多个空白和换行
            text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

            // 截断过长的文本，防止撑爆 Token
            const MAX_LENGTH = 15000;
            if (text.length > MAX_LENGTH) {
                text = text.substring(0, MAX_LENGTH) + "\n\n...(内容截断，已达到最大长度限制)...";
            }

            return {
                content: [{ type: "text", text: text }],
                details: {}
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `[SYSTEM] 网页读取失败: ${error.message}` }],
                details: { error: true }
            };
        }
    }
};
