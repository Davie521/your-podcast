# Issue #2: 集成 Podcastfy 生成播客对话脚本

**Status:** OPEN
**Link:** https://github.com/Davie521/your-podcast/issues/2

## 概述

集成 [Podcastfy](https://github.com/souzatharsis/podcastfy) 库，将 Gemini 筛选后的新闻摘要转换为双人对话脚本，作为 TTS 合成的输入。

## 背景

Podcastfy 是一个开源库，可以将文本内容转换为播客风格的对话脚本。在我们的流水线中，它位于 Gemini 筛选之后、GLM TTS 合成之前：

```
RSS 抓取 → Gemini 筛选 → 【Podcastfy 对话脚本】→ GLM TTS → MP3
```

## 任务

### 1. 安装与配置
- [ ] 添加 `podcastfy` 到 `backend/requirements.txt`
- [ ] 在 `backend/app/config.py` 中添加 Podcastfy 相关配置（Gemini API key 等）

### 2. 实现服务层
- [ ] 创建 `backend/app/services/podcast.py`
- [ ] 封装 Podcastfy 调用，输入为筛选后的新闻列表，输出为对话脚本
- [ ] 对话脚本格式：带角色标记的文本列表（小明/小红交替对话）
- [ ] 自定义 conversation config：中文输出、科技播客风格、双主持人

### 3. 对话脚本要求
- [ ] 中文输出
- [ ] 双主持人格式（小明、小红），风格自然轻松
- [ ] 每期覆盖当日精选的 3-5 条新闻
- [ ] 包含开场白和结尾语
- [ ] 每条新闻之间有自然过渡

### 4. 与流水线集成
- [ ] 在 `generate.py` 中调用 podcast service
- [ ] 确保输出格式与下游 TTS 服务兼容（逐句文本 + 角色标记）

### 5. 错误处理
- [ ] Podcastfy/Gemini API 调用失败时的重试机制
- [ ] 超时处理（脚本生成可能需要 30s+）
- [ ] 日志记录

## 参考

- Podcastfy 文档: https://github.com/souzatharsis/podcastfy
- 项目架构: `CLAUDE.md`
