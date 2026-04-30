# 朝廷Agent 项目交接文档

_最后更新：2026-04-28 | 对话 ID: d1ce8c22_

---

## Gabriel 的背景与目标

- 社会学专业背景，非CS
- 目标：应聘 AI 产品经理，需要一个有技术深度的作品集项目
- 技术资源：MiniMax API、DeepSeek API、本地 Qwen 4B、NewsAPI

---

## 项目：朝廷 Agent

**一句话定位**：基于唐朝三省六部制的多 Agent 编排 CLI 工具，专注"个人复杂决策辅助"场景。

**核心差异化**：output 不是报告，而是"奏折"格式的交互式决策方案，用户（皇上）只需拍板：准奏 / 驳回 / 追问。

**文件夹位置**：
- pi-mono：`/Users/shiyunyang/workspace/pi-mono`（已有）
- 朝廷Agent：`/Users/shiyunyang/workspace/chaoting-agent`（已建好）
- VS Code 工作区文件：`/Users/shiyunyang/pi-mono×chaoting.code-workspace`

**chaoting-agent 目录结构**（已创建）：
```
chaoting-agent/
├── README.md          ← 已写好
├── src/
│   ├── agents/
│   ├── tools/
│   └── output/
├── docs/
└── my-study/
```

---

## 架构设计（已确定）

```
用户（皇上）→ 太子（分拣）→ 中书省（规划）→ 门下省（审核/封驳）
→ 尚书省（调度）→ 六部并行执行 → 奏折输出 → 用户拍板
```

**技术依赖**：
- `@mariozechner/pi-ai` 和 `@mariozechner/pi-agent`（来自 pi-mono，直接引用）

---

## 下一步待完成

- [ ] 绑定 chaoting-agent 工作区
- [ ] 初始化 `package.json`（引入 pi-mono 依赖）
- [ ] Phase 1：写第一个"太子 Agent"（单 Agent MVP）

---

## 给下一次对话的 Antigravity

1. 详细规划文档在 artifact：`chaoting-agent-plan.md`
2. pi-mono 学习指南在 artifact：`pi-mono-learning-guide.md`
3. chaoting-agent 的 README 已写好，下一步做 `package.json`
4. Gabriel 不需要解释基础概念了，直接进入实现阶段
