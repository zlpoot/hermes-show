# Hermes Agent 功能清单

## 一、核心能力

### 1. 对话与推理
- 多模型支持（OpenAI、Anthropic、DeepSeek、天翼云、京东云等）
- 多轮对话记忆
- 工具调用与函数执行
- 自主任务规划与执行

### 2. 终端与代码
- Shell 命令执行
- 文件读写与搜索
- 代码编辑与补丁
- Git/GitHub 操作
- 项目脚手架

### 3. 浏览器自动化
- 网页导航与交互
- 表单填写与提交
- 截图与视觉分析
- 数据抓取

---

## 二、消息平台集成

| 平台 | 功能 | 状态 |
|------|------|------|
| **微信** | 收发消息、图片、文件 | ✅ 已配置 |
| **Telegram** | 收发消息、按钮交互 | ✅ 支持 |
| **Discord** | 频道消息、Slash命令 | ✅ 支持 |
| **WhatsApp** | 收发消息 | ✅ 支持 |
| **Slack** | 频道消息、App集成 | ✅ 支持 |
| **SMS** | 短信收发 | ✅ 支持 |

---

## 三、与 iPhone/iOS 应用联动

### Apple 原生应用（需 macOS 作为中转）

| 应用 | 功能 | 同步方式 |
|------|------|----------|
| **iMessage** | 发送/接收消息、查看历史 | iCloud 同步 |
| **Reminders（提醒事项）** | 创建/完成/删除任务 | iCloud 同步到 iPhone |
| **Notes（备忘录）** | 创建/搜索/编辑笔记 | iCloud 同步到 iPhone |
| **Find My（查找）** | 查找设备位置 | iCloud 同步 |

**使用条件：**
- Hermes 需运行在 macOS 上
- 安装对应 CLI 工具（imsg、remindctl、memo）
- 授权 Full Disk Access 和 Automation 权限

### 通过消息网关间接联动

| 方式 | 说明 |
|------|------|
| **微信** | 直接在微信中与 Hermes 对话，发送指令 |
| **SMS** | 通过短信网关发送指令 |
| **Telegram** | 通过 Telegram Bot 对话 |

---

## 四、生产力工具集成

| 工具 | 功能 |
|------|------|
| **Google Workspace** | Gmail、Calendar、Drive、Sheets、Docs |
| **Notion** | 页面/数据库创建与管理 |
| **Linear** | 任务和项目管理 |
| **Obsidian** | 知识库管理 |
| **PDF** | 编辑、OCR、提取文本 |
| **PowerPoint** | 创建和编辑演示文稿 |

---

## 五、开发与运维

| 类别 | 工具 |
|------|------|
| **GitHub** | PR、Issues、代码审查、CI/CD |
| **MCP** | Model Context Protocol 集成 |
| **Cron** | 定时任务调度 |
| **Webhook** | 事件订阅与处理 |
| **服务器** | SSH、部署、监控 |

---

## 六、AI 与机器学习

| 类别 | 功能 |
|------|------|
| **模型推理** | vLLM、llama.cpp、GGUF 量化 |
| **微调训练** | Axolotl、Unsloth、TRL、PEFT |
| **评估** | LM Evaluation Harness |
| **实验追踪** | Weights & Biases |
| **Hugging Face** | 模型下载/上传 |

---

## 七、创意与媒体

| 类别 | 功能 |
|------|------|
| **图像生成** | Stable Diffusion |
| **音乐生成** | Suno、AudioCraft |
| **语音** | Whisper 识别、TTS 合成 |
| **视频** | ASCII 视频、Manim 动画 |
| **图表** | Excalidraw、架构图 |

---

## 八、智能家居

| 平台 | 功能 |
|------|------|
| **Philips Hue** | 灯光控制、场景切换 |
| **Home Assistant** | 全屋智能设备控制 |

---

## 九、研究与信息

| 来源 | 功能 |
|------|------|
| **arXiv** | 论文搜索与获取 |
| **YouTube** | 字幕提取、内容分析 |
| **RSS/Blog** | 内容监控与订阅 |
| **Polymarket** | 预测市场数据 |

---

## iPhone 用户使用方式

### 方式一：微信对话（推荐）
直接在微信中与 Hermes 对话，发送指令完成各种任务。

### 方式二：Telegram Bot
通过 Telegram 与 Hermes 对话。

### 方式三：macOS 中转
如果 Hermes 运行在 Mac 上：
- 创建的提醒事项自动同步到 iPhone
- 创建的备忘录自动同步到 iPhone
- 发送的 iMessage 在 iPhone 上可见

### 方式四：网页控制台
通过 hermes-show 网页界面查看和管理：
- http://your-server:3000

---

## 快速命令示例

```bash
# 微信对话中发送：
帮我写一个 Python 脚本
查看今天的日程
创建一个提醒：明天上午10点开会
搜索 arXiv 上的 LLM 论文
```
