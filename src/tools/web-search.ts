import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";

// 1. 使用 TypeBox 定义严格的入参结构 (这是大模型能够正确调用的关键)
const WebSearchParameters = Type.Object({
    query: Type.String({ description: "要在搜索引擎中检索的具体关键字或短语" }),
    searchDepth: Type.Optional(Type.String({ description: "搜索深度，可选 'basic' 或 'advanced'" }))
});

type WebSearchArgs = Static<typeof WebSearchParameters>;

// 2. 实现 AgentTool 接口
export const webSearchTool: AgentTool<typeof WebSearchParameters> = {
    name: "web_search",
    label: "Web Search (Tavily)",
    description: "专为 Agent 打造的全网搜索引擎。当需要核实客观事实、获取最新数据时使用此工具。",
    parameters: WebSearchParameters,
    
    // 3. 核心执行逻辑
    execute: async (toolCallId: string, params: WebSearchArgs, signal?: AbortSignal) => {
        try {
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) {
                return {
                    content: [{ type: "text", text: "搜索失败：系统未配置 TAVILY_API_KEY，请在 .env 文件中添加该密钥。" }],
                    details: { error: true, missingKey: true }
                };
            }

            const searchDepth = params.searchDepth || "basic";
            
            // 调用专为大模型打造的 Tavily API
            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: params.query,
                    search_depth: searchDepth,
                    include_answer: true,
                    max_results: 5
                }),
                signal
            });

            if (!response.ok) {
                throw new Error(`Tavily API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Tavily 会直接返回高度浓缩的 summary (answer) 和优质的结果列表
            let resultText = `### Tavily 智能总结\n${data.answer || "无直接回答，请参考以下网页摘要。"}\n\n### 参考资料\n`;
            
            if (data.results && data.results.length > 0) {
                data.results.forEach((item: any, i: number) => {
                    resultText += `[${i+1}] **${item.title}**\n${item.content}\nURL: ${item.url}\n\n`;
                });
            } else {
                resultText = "未找到相关结果。";
            }

            // 4. 返回标准格式给大模型
            return {
                content: [{ type: "text", text: resultText }],
                details: { totalResults: data.results?.length || 0 }
            };

        } catch (error) {
            return {
                content: [{ type: "text", text: `搜索失败: ${error instanceof Error ? error.message : String(error)}` }],
                details: { error: true }
            };
        }
    }
};
