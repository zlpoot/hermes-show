# Discord Bot 配置指南

## 一、创建 Discord Bot 应用

### 步骤 1：访问开发者门户

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 登录你的 Discord 账号
3. 点击右上角 **「New Application」**
4. 输入应用名称（如：Hermes Agent）
5. 点击 **「Create」**

### 步骤 2：获取 Bot Token

1. 在左侧菜单选择 **「Bot」**
2. 点击 **「Add Bot」** → **「Yes, do it!」**
3. 在 Bot 页面，点击 **「Reset Token」** 生成新 Token
4. **复制并保存 Token**（只显示一次！）

### 步骤 3：配置 Bot 权限

在 Bot 页面，勾选以下 **Privileged Gateway Intents**：

- ✅ **MESSAGE CONTENT INTENT** - 读取消息内容（必需）
- ✅ **SERVER MEMBERS INTENT** - 读取成员信息（可选）
- ✅ **PRESENCE INTENT** - 读取状态信息（可选）

点击 **「Save Changes」** 保存。

### 步骤 4：邀请 Bot 到服务器

1. 左侧菜单选择 **「OAuth2」** → **「URL Generator」**
2. 在 **Scopes** 勾选：
   - ✅ `bot`
   - ✅ `applications.commands`（支持斜杠命令）

3. 在 **Bot Permissions** 勾选：
   - ✅ `Send Messages`
   - ✅ `Send Messages in Threads`
   - ✅ `Create Public Threads`
   - ✅ `Create Private Threads`
   - ✅ `Embed Links`
   - ✅ `Attach Files`
   - ✅ `Read Message History`
   - ✅ `Mention Everyone`
   - ✅ `Add Reactions`
   - ✅ `Use Slash Commands`

4. 底部会生成一个邀请链接，复制并在浏览器打开
5. 选择要加入的服务器，点击 **「授权」**

---

## 二、配置 Hermes Agent

### 方法一：环境变量方式

在 `~/.hermes/.env` 文件中添加：

```bash
# Discord Bot Token
DISCORD_TOKEN=你的_BOT_TOKEN

# 服务器 ID（可选，用于限制特定服务器）
DISCORD_GUILD_ID=你的服务器ID
```

### 方法二：config.yaml 配置

编辑 `~/.hermes/config.yaml`：

```yaml
discord:
  require_mention: false        # 是否需要 @提及 才响应
  free_response_channels: ""    # 自由响应频道（逗号分隔ID）
  allowed_channels: ""          # 允许的频道（空=全部）
  auto_thread: true             # 自动创建线程
  reactions: true               # 消息反应
  channel_prompts: {}           # 频道专属提示词
```

### 获取频道/服务器 ID

1. Discord 设置 → 高级 → 开启 **「开发者模式」**
2. 右键点击频道/服务器 → **「复制 ID」**

---

## 三、启动 Discord Gateway

```bash
# 启动 Discord Gateway
hermes gateway start --platform discord

# 或作为后台服务
hermes gateway start --platform discord --daemon
```

---

## 四、测试 Bot

在 Discord 中：

1. 在 Bot 所在频道发送消息
2. 如果设置了 `require_mention: true`，需要 @Bot 名称
3. Bot 会自动回复

---

## 常见问题

### Bot 不响应

1. 检查 Token 是否正确
2. 确认 MESSAGE CONTENT INTENT 已开启
3. 查看日志：`hermes logs discord`

### 权限不足

确保 Bot 在频道有 **读写消息权限**。

### 无法读取消息内容

必须在 Developer Portal 开启 **Message Content Intent**。
