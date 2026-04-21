# Hermes Show 跨平台环境配置指南

本文档说明如何在 Windows、macOS 和 Linux 上配置 Hermes Show 的环境变量。

## 快速开始

1. 复制环境变量模板：
   ```bash
   cp .env.example .env
   ```

2. 根据您的平台编辑 `.env` 文件。

## 平台特定配置

### Linux

Linux 是 Hermes 的原生运行环境，通常无需特殊配置：

```bash
# Hermes 配置目录（默认 ~/.hermes）
NUXT_HERMES_PATH=/home/yourusername/.hermes

# 工作目录
NUXT_WORK_DIR=/home/yourusername
```

### macOS

与 Linux 类似，使用默认路径即可：

```bash
# Hermes 配置目录（默认 ~/.hermes）
NUXT_HERMES_PATH=/Users/yourusername/.hermes

# 工作目录
NUXT_WORK_DIR=/Users/yourusername
```

### Windows

Windows 有多种运行模式：

#### 1. Windows 本地运行

如果 Hermes 直接安装在 Windows 上：

```env
NUXT_HERMES_PATH=C:\Users\yourusername\.hermes
NUXT_WORK_DIR=C:\Users\yourusername
```

#### 2. 从 Windows 访问 WSL

如果 Hermes 运行在 WSL 中，但 Show 在 Windows 上运行：

```env
# WSL 路径格式
NUXT_HERMES_PATH=\\wsl$\Ubuntu-20.04\home\yourusername\.hermes
NUXT_WORK_DIR=\\wsl$\Ubuntu-20.04\home\yourusername
```

#### 3. 在 WSL 内运行

如果 Show 也在 WSL 内运行，使用 Linux 格式：

```env
NUXT_HERMES_PATH=/home/yourusername/.hermes
NUXT_WORK_DIR=/home/yourusername
```

## 自动路径检测

如果不设置 `NUXT_HERMES_PATH`，系统会自动检测：

1. **Linux/macOS**: `~/.hermes`
2. **Windows**: 
   - 自动检测 WSL 发行版并尝试连接
   - 回退到 `C:\Users\<用户名>\.hermes`

## 网关授权配置

### 环境变量方式

```env
# 允许所有用户访问网关
NUXT_GATEWAY_ALLOW_ALL_USERS=true

# 微信允许所有用户访问
NUXT_WEIXIN_ALLOW_ALL_USERS=true

# 微信消息策略: open（开放模式）或 pairing（配对模式）
NUXT_WEIXIN_DM_POLICY=open
```

### Hermes config.yaml 方式

这些配置也可以在 `~/.hermes/config.yaml` 中设置：

```yaml
weixin:
  dm_policy: open

# 或使用顶级配置
GATEWAY_ALLOW_ALL_USERS: true
```

**优先级**: 环境变量 > config.yaml

## 开发配置

```env
# 开发服务器端口
NUXT_PORT=3000

# 开发服务器主机
NUXT_HOST=localhost
```

## 生产部署

生产环境建议使用以下配置：

```env
# 明确指定 Hermes 路径
NUXT_HERMES_PATH=/home/user/.hermes

# 工作目录
NUXT_WORK_DIR=/home/user

# 授权策略
NUXT_GATEWAY_ALLOW_ALL_USERS=false
NUXT_WEIXIN_DM_POLICY=pairing
```

## 常见问题

### Q: Windows 上找不到 Hermes 配置目录？

A: 检查以下几点：
1. 确认 WSL 已正确安装并运行
2. 使用正确的 WSL 发行版名称（如 `Ubuntu-20.04`）
3. 路径分隔符使用 `\`（Windows）或 `\\wsl$\`（WSL 网络路径）

### Q: 如何确认路径配置正确？

A: 访问 Show 的系统状态页面，查看 Hermes 路径是否正确显示。

### Q: 环境变量不生效？

A: 确保：
1. 环境变量名以 `NUXT_` 开头
2. 重启开发服务器 `pnpm dev`
3. 检查 `.env` 文件是否在项目根目录

## 相关文件

- `.env.example` - 环境变量模板
- `nuxt.config.ts` - Nuxt 运行时配置
- `server/utils/hermes.ts` - 跨平台路径处理
