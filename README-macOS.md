# Hermes Show - macOS 部署指南

本文档介绍如何在 macOS 上部署和运行 Hermes Show Web 控制台。

## 系统要求

- macOS 12.0 (Monterey) 或更高版本
- Node.js 18.x 或更高版本
- pnpm 8.x 或更高版本

## 快速开始

### 1. 安装依赖

```bash
# 安装 pnpm（如果尚未安装）
brew install pnpm
# 或通过 npm 安装
# npm install -g pnpm

# 克隆项目
git clone https://github.com/zlpoot/hermes-show.git
cd hermes-show

# 安装依赖
pnpm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置（可选）
# Mac 上 Hermes 默认路径为 ~/.hermes，通常无需修改
nano .env
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000 查看控制台。

## 生产环境部署

### 方式一：PM2 托管（推荐）

```bash
# 全局安装 PM2
npm install -g pm2

# 构建生产版本
pnpm build

# 启动服务
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

创建 `ecosystem.config.js` 文件：

```javascript
module.exports = {
  apps: [{
    name: 'hermes-show',
    script: './.output/server/index.mjs',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 方式二：launchd 系统服务

创建 `~/Library/LaunchAgents/com.hermes.show.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hermes.show</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/你的用户名/hermes-show/.output/server/index.mjs</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/hermes-show.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/hermes-show.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
    </dict>
</dict>
</plist>
```

加载服务：

```bash
# 构建生产版本
cd ~/hermes-show
pnpm build

# 加载服务
launchctl load ~/Library/LaunchAgents/com.hermes.show.plist

# 查看服务状态
launchctl list | grep hermes

# 停止服务
launchctl unload ~/Library/LaunchAgents/com.hermes.show.plist
```

## Hermes Gateway 配置

如果需要连接 Hermes Gateway，需要同时运行 Gateway 服务。

### Gateway launchd 配置

创建 `~/Library/LaunchAgents/com.hermes.gateway.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hermes.gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>-m</string>
        <string>hermes.gateway</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/hermes-gateway.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/hermes-gateway.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>DISCORD_PROXY</key>
        <string>http://127.0.0.1:7890</string>
        <key>GATEWAY_ALLOW_ALL_USERS</key>
        <string>true</string>
    </dict>
</dict>
</plist>
```

## 常见问题

### Q: sqlite3 找不到

项目会自动检测以下路径：
- `/opt/homebrew/bin/sqlite3` (Apple Silicon Homebrew)
- `/usr/local/opt/sqlite/bin/sqlite3` (Intel Homebrew)
- `/usr/bin/sqlite3` (系统自带)
- `/usr/local/bin/sqlite3`

如果仍然找不到，可以手动安装：

```bash
brew install sqlite
```

### Q: 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
```

### Q: Node 版本过低

```bash
# 使用 Homebrew 安装最新 Node.js
brew install node

# 或使用 nvm 管理多版本
brew install nvm
nvm install 20
nvm use 20
```

### Q: 权限问题

```bash
# 确保 .hermes 目录权限正确
chmod -R 755 ~/.hermes
```

## 目录结构

```
hermes-show/
├── app/                 # Vue 页面组件
├── server/              # Nitro 服务端 API
├── assets/              # 静态资源
├── public/              # 公共文件
├── nuxt.config.ts       # Nuxt 配置
├── tailwind.config.ts   # Tailwind 配置
└── .env                 # 环境变量
```

## 相关链接

- [Hermes Agent 文档](https://github.com/zlpoot/hermes)
- [Nuxt.js 文档](https://nuxt.com)
- [TailwindCSS 文档](https://tailwindcss.com)

## 支持

如遇问题，请在 [GitHub Issues](https://github.com/zlpoot/hermes-show/issues) 提交反馈。
