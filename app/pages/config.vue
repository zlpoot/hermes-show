<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="glass-panel p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Cpu class="text-primary" :size="24" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold">配置中心</h2>
              <span v-if="initialData?.isRealHermesConnected" class="text-xs px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded">已连接</span>
              <span v-else class="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded">Mock 模式</span>
            </div>
            <p class="text-muted-foreground text-sm mt-1">{{ initialData?.configPath || '未检测到配置文件' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="exportConfig" class="btn-outline text-sm flex items-center gap-1">
            <Download :size="14" />
            导出
          </button>
          <label class="btn-outline text-sm flex items-center gap-1 cursor-pointer">
            <Upload :size="14" />
            导入
            <input type="file" @change="importConfig" accept=".yaml,.yml,.json" class="hidden" />
          </label>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="glass-panel">
      <div class="flex border-b border-card-border overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="['px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
            activeTab === tab.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground']">
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Model Tab -->
    <div v-show="activeTab === 'model'" class="space-y-6">
      <!-- Current Model -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Zap :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">当前模型</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">提供商 <span class="text-red-400">*</span></label>
            <select v-model="form.model.provider"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              :class="{'border-red-500': errors.model?.provider}">
              <option value="">选择提供商</option>
              <option v-for="(cfg, id) in form.providers" :key="id" :value="id">
                {{ cfg.name || id }}
              </option>
            </select>
            <p v-if="errors.model?.provider" class="text-xs text-red-400">{{ errors.model.provider }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">模型名称 <span class="text-red-400">*</span></label>
            <input type="text" v-model="form.model.default"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              :class="{'border-red-500': errors.model?.default}"
              :placeholder="currentProviderConfig?.default_model || '输入模型名称'" />
            <p v-if="errors.model?.default" class="text-xs text-red-400">{{ errors.model.default }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">API 模式</label>
            <select v-model="form.model.api_mode"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="openai">OpenAI 兼容</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
        </div>

        <!-- Provider Details -->
        <div v-if="currentProviderConfig" class="mt-4 p-4 bg-muted/30 rounded-xl border border-card-border">
          <h4 class="text-sm font-medium mb-3 text-muted-foreground">提供商详情</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span class="text-muted-foreground">API 端点:</span>
              <span class="ml-2 font-mono text-xs break-all">{{ currentProviderConfig.base_url }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">密钥环境变量:</span>
              <span class="ml-2 font-mono text-xs">{{ currentProviderConfig.key_env || '无' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">默认模型:</span>
              <span class="ml-2">{{ currentProviderConfig.default_model || '未设置' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Providers Management -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Server :size="18" class="text-primary" />
            <h3 class="text-lg font-semibold">提供商管理</h3>
          </div>
          <button @click="openProviderModal()" class="btn-primary text-sm flex items-center gap-1">
            <Plus :size="14" />
            添加提供商
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="(provider, id) in form.providers" :key="id"
            class="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-card-border hover:border-primary/30 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cloud :size="18" class="text-primary" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ provider.name || id }}</span>
                  <span v-if="id === form.model.provider" class="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">当前</span>
                </div>
                <p class="text-xs text-muted-foreground font-mono">{{ provider.base_url }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="openProviderModal(id)" class="p-2 hover:bg-muted rounded-lg transition-colors">
                <Pencil :size="14" class="text-muted-foreground" />
              </button>
              <button @click="deleteProvider(id)" class="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 :size="14" class="text-red-400" />
              </button>
            </div>
          </div>
          
          <div v-if="Object.keys(form.providers).length === 0" class="text-center py-8 text-muted-foreground">
            <Cloud :size="32" class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无提供商配置</p>
            <p class="text-xs">点击上方按钮添加</p>
          </div>
        </div>
      </div>

      <!-- Fallback Model -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <RefreshCw :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">故障转移模型</h3>
          <span class="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">可选</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">故障转移提供商</label>
            <select v-model="form.fallback_model.provider"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">禁用</option>
              <option v-for="(cfg, id) in form.providers" :key="id" :value="id">
                {{ cfg.name || id }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">故障转移模型</label>
            <input type="text" v-model="form.fallback_model.model"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="如: anthropic/claude-sonnet-4" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">当主模型不可用时（如限流、服务错误），自动切换到此模型</p>
      </div>
    </div>

    <!-- Agent Tab -->
    <div v-show="activeTab === 'agent'" class="space-y-6">
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Bot :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">Agent 设置</h3>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Max Tokens</label>
            <input type="number" v-model="form.agent.max_tokens"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="1" max="1000000" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">Max Turns</label>
            <input type="number" v-model="form.agent.max_turns"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="1" max="500" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">Gateway Timeout (秒)</label>
            <input type="number" v-model="form.agent.gateway_timeout"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="60" max="7200" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">Reasoning Effort</label>
            <select v-model="form.agent.reasoning_effort"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-6 mt-6 pt-6 border-t border-card-border">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.streaming.enabled" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">流式输出 (Streaming)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.agent.save_trajectories" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">保存训练轨迹</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.agent.verbose" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">详细日志 (Verbose)</span>
          </label>
        </div>
      </div>

      <!-- Context Compression -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Layers :size="18" class="text-primary" />
            <h3 class="text-lg font-semibold">上下文压缩</h3>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.compression.enabled" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">启用</span>
          </label>
        </div>

        <div v-if="form.compression.enabled" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">压缩阈值</label>
            <div class="flex items-center gap-2">
              <input type="range" v-model="form.compression.threshold" min="0.1" max="1" step="0.1"
                class="flex-1" />
              <span class="text-sm w-12 text-right">{{ Math.round(form.compression.threshold * 100) }}%</span>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">目标压缩比</label>
            <div class="flex items-center gap-2">
              <input type="range" v-model="form.compression.target_ratio" min="0.1" max="0.5" step="0.05"
                class="flex-1" />
              <span class="text-sm w-12 text-right">{{ Math.round(form.compression.target_ratio * 100) }}%</span>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">保护最近消息数</label>
            <input type="number" v-model="form.compression.protect_last_n"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="5" max="50" />
          </div>
        </div>
      </div>

      <!-- Memory -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Brain :size="18" class="text-primary" />
            <h3 class="text-lg font-semibold">记忆系统</h3>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.memory.memory_enabled" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">启用</span>
          </label>
        </div>

        <div v-if="form.memory.memory_enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.memory.user_profile_enabled" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">用户画像</span>
          </label>
          <div class="space-y-2">
            <label class="block text-sm font-medium">记忆字符上限</label>
            <input type="number" v-model="form.memory.memory_char_limit"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="500" max="5000" />
          </div>
        </div>
      </div>
    </div>

    <!-- Terminal Tab -->
    <div v-show="activeTab === 'terminal'" class="space-y-6">
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <TerminalSquare :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">终端配置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">后端类型</label>
            <select v-model="form.terminal.backend"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="local">Local (本地)</option>
              <option value="docker">Docker</option>
              <option value="modal">Modal (云端)</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">默认超时 (秒)</label>
            <input type="number" v-model="form.terminal.timeout"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="10" max="3600" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">生命周期 (秒)</label>
            <input type="number" v-model="form.terminal.lifetime_seconds"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="60" max="3600" />
          </div>
        </div>

        <div class="flex flex-wrap gap-6 mt-6 pt-6 border-t border-card-border">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.terminal.persistent_shell" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">持久化 Shell</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.terminal.container_persistent" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">容器持久化</span>
          </label>
        </div>
      </div>

      <!-- Container Settings (for Docker/Modal) -->
      <div v-if="form.terminal.backend !== 'local'" class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Box :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">容器设置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">CPU 核心</label>
            <input type="number" v-model="form.terminal.container_cpu"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="0.5" max="16" step="0.5" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">内存 (MB)</label>
            <input type="number" v-model="form.terminal.container_memory"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="512" max="32768" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">磁盘 (MB)</label>
            <input type="number" v-model="form.terminal.container_disk"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="1024" max="102400" />
          </div>
        </div>

        <div class="mt-4 space-y-2">
          <label class="block text-sm font-medium">Docker 镜像</label>
          <input type="text" v-model="form.terminal.docker_image"
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm font-mono"
            placeholder="nikolaik/python-nodejs:python3.11-nodejs20" />
        </div>
      </div>
    </div>

    <!-- Browser Tab -->
    <div v-show="activeTab === 'browser'" class="space-y-6">
      <!-- Browser Settings -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Globe :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">浏览器配置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">不活动超时 (秒)</label>
            <input type="number" v-model="form.browser.inactivity_timeout"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="30" max="600" />
            <p class="text-xs text-muted-foreground">页面无操作自动关闭时间</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">命令超时 (秒)</label>
            <input type="number" v-model="form.browser.command_timeout"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="10" max="120" />
            <p class="text-xs text-muted-foreground">单个浏览器命令超时时间</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">云提供商</label>
            <select v-model="form.browser.cloud_provider"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="local">Local (本地)</option>
              <option value="browserbase">Browserbase</option>
              <option value="browser-use">Browser Use</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-6 mt-6 pt-6 border-t border-card-border">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.browser.record_sessions" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">录制会话</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.browser.allow_private_urls" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">允许私有 URL</span>
          </label>
        </div>
      </div>

      <!-- CDP Settings -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Lock :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">CDP 远程调试</h3>
          <span class="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">可选</span>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium">CDP URL</label>
          <input type="text" v-model="form.browser.cdp_url"
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm font-mono"
            placeholder="ws://localhost:9222" />
          <p class="text-xs text-muted-foreground">Chrome DevTools Protocol 远程调试地址，留空使用本地浏览器</p>
        </div>
      </div>
    </div>

    <!-- Display Tab -->
    <div v-show="activeTab === 'display'" class="space-y-6">
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Palette :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">显示设置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium">人格风格</label>
            <select v-model="form.display.personality"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="helpful">Helpful (有帮助)</option>
              <option value="concise">Concise (简洁)</option>
              <option value="technical">Technical (技术专家)</option>
              <option value="creative">Creative (创意)</option>
              <option value="teacher">Teacher (教师)</option>
              <option value="kawaii">Kawaii (可爱)</option>
              <option value="catgirl">Catgirl (猫娘)</option>
              <option value="pirate">Pirate (海盗)</option>
              <option value="shakespeare">Shakespeare (莎士比亚)</option>
              <option value="surfer">Surfer (冲浪者)</option>
              <option value="noir">Noir (黑色电影)</option>
              <option value="uwu">UwU</option>
              <option value="philosopher">Philosopher (哲学家)</option>
              <option value="hype">Hype (热情)</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">Dashboard 主题</label>
            <select v-model="form.dashboard.theme"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-6 mt-6 pt-6 border-t border-card-border">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.display.compact" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">紧凑模式</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.display.show_reasoning" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">显示推理过程</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.display.show_cost" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">显示成本</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.display.inline_diffs" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">内联差异</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.display.bell_on_complete" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">完成时响铃</span>
          </label>
        </div>
      </div>

      <!-- TTS Settings -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Volume2 :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">语音合成 (TTS)</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">TTS 提供商</label>
            <select v-model="form.tts.provider"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="edge">Edge TTS (免费)</option>
              <option value="openai">OpenAI TTS</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="xai">X.AI</option>
              <option value="mistral">Mistral</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">语音</label>
            <input type="text" v-model="form.tts.voice"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              :placeholder="ttsVoicePlaceholder" />
          </div>
        </div>
      </div>

      <!-- STT Settings -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Mic :size="18" class="text-primary" />
            <h3 class="text-lg font-semibold">语音识别 (STT)</h3>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.stt.enabled" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">启用</span>
          </label>
        </div>

        <div v-if="form.stt.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">STT 提供商</label>
            <select v-model="form.stt.provider"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="local">Local (Whisper 本地)</option>
              <option value="openai">OpenAI Whisper API</option>
              <option value="mistral">Mistral</option>
            </select>
          </div>
          <div v-if="form.stt.provider === 'local'" class="space-y-2">
            <label class="block text-sm font-medium">Whisper 模型</label>
            <select v-model="form.stt.local_model"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="tiny">Tiny</option>
              <option value="base">Base</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Voice Settings -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Volume2 :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">语音控制</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">录音快捷键</label>
            <input type="text" v-model="form.voice.record_key"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm font-mono"
              placeholder="ctrl+b" />
            <p class="text-xs text-muted-foreground">按住此键开始录音</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">最大录音时长 (秒)</label>
            <input type="number" v-model="form.voice.max_recording_seconds"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="10" max="300" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">静音检测时长 (秒)</label>
            <input type="number" v-model="form.voice.silence_duration"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="1" max="10" />
            <p class="text-xs text-muted-foreground">静音多久自动停止录音</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-6 mt-6 pt-6 border-t border-card-border">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.voice.auto_tts" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">自动语音回复</span>
          </label>
        </div>
        <p class="text-xs text-muted-foreground mt-2">启用后，AI 回复会自动转换为语音输出</p>
      </div>

      <!-- Human Delay -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Clock :size="18" class="text-primary" />
            <h3 class="text-lg font-semibold">模拟人类延迟</h3>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.human_delay.mode" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">启用</span>
          </label>
        </div>

        <div v-if="form.human_delay.mode" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">最小延迟 (毫秒)</label>
            <input type="number" v-model="form.human_delay.min_ms"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="100" max="5000" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">最大延迟 (毫秒)</label>
            <input type="number" v-model="form.human_delay.max_ms"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="500" max="10000" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-2">模拟人类打字延迟，让对话更自然</p>
      </div>
    </div>

    <!-- Security Tab -->
    <div v-show="activeTab === 'security'" class="space-y-6">
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Shield :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">安全设置</h3>
        </div>

        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer p-4 bg-muted/20 rounded-xl border border-card-border">
            <div>
              <p class="text-sm font-medium">隐藏敏感信息</p>
              <p class="text-xs text-muted-foreground">在日志中自动脱敏密钥等敏感数据</p>
            </div>
            <input type="checkbox" v-model="form.security.redact_secrets" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
          <label class="flex items-center justify-between cursor-pointer p-4 bg-muted/20 rounded-xl border border-card-border">
            <div>
              <p class="text-sm font-medium">MCP 安全扫描</p>
              <p class="text-xs text-muted-foreground">安装插件前检查已知漏洞 (OSV)</p>
            </div>
            <input type="checkbox" v-model="form.mcp.osv_scanning" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
          <label class="flex items-center justify-between cursor-pointer p-4 bg-muted/20 rounded-xl border border-card-border">
            <div>
              <p class="text-sm font-medium">Tirith 策略检查</p>
              <p class="text-xs text-muted-foreground">启用策略检查引擎</p>
            </div>
            <input type="checkbox" v-model="form.security.tirith_enabled" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
          <label class="flex items-center justify-between cursor-pointer p-4 bg-muted/20 rounded-xl border border-card-border">
            <div>
              <p class="text-sm font-medium">PII 脱敏</p>
              <p class="text-xs text-muted-foreground">自动识别并脱敏个人身份信息</p>
            </div>
            <input type="checkbox" v-model="form.privacy.redact_pii" class="w-4 h-4 rounded border-card-border text-primary" />
          </label>
        </div>
      </div>

      <!-- Approvals -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <CheckSquare :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">审批设置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">审批模式</label>
            <select v-model="form.approvals.mode"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="manual">Manual (手动审批)</option>
              <option value="auto">Auto (自动批准)</option>
              <option value="suggest">Suggest (建议模式)</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">审批超时 (秒)</label>
            <input type="number" v-model="form.approvals.timeout"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="10" max="300" />
          </div>
        </div>
      </div>

      <!-- Logging -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <FileText :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">日志设置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">日志级别</label>
            <select v-model="form.logging.level"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">最大文件大小 (MB)</label>
            <input type="number" v-model="form.logging.max_size_mb"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="1" max="100" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">备份数量</label>
            <input type="number" v-model="form.logging.backup_count"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="1" max="10" />
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Tab -->
    <div v-show="activeTab === 'advanced'" class="space-y-6">
      <!-- Auxiliary Models -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <Cpu :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">辅助模型配置</h3>
        </div>

        <p class="text-sm text-muted-foreground mb-4">为特定任务配置专用模型，留空则使用主模型</p>

        <div class="space-y-4">
          <div v-for="(task, key) in auxiliaryTasks" :key="key" class="p-4 bg-muted/20 rounded-xl border border-card-border">
            <div class="flex items-center gap-2 mb-3">
              <component :is="task.icon" :size="16" class="text-primary" />
              <span class="font-medium text-sm">{{ task.label }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">提供商</label>
                <select v-model="form.auxiliary[key].provider"
                  class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm">
                  <option value="auto">自动 (主模型)</option>
                  <option v-for="(cfg, id) in form.providers" :key="id" :value="id">
                    {{ cfg.name || id }}
                  </option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">模型名称</label>
                <input type="text" v-model="form.auxiliary[key].model"
                  class="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
                  :placeholder="task.placeholder" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkpoints -->
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <Save :size="18" class="text-primary" />
            <h3 class="text-lg font-semibold">检查点</h3>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.checkpoints.enabled" class="w-4 h-4 rounded border-card-border text-primary" />
            <span class="text-sm">启用</span>
          </label>
        </div>

        <div v-if="form.checkpoints.enabled" class="space-y-2">
          <label class="block text-sm font-medium">最大快照数</label>
          <input type="number" v-model="form.checkpoints.max_snapshots"
            class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
            min="10" max="100" />
        </div>
      </div>

      <!-- Session Reset -->
      <div class="glass-panel p-6">
        <div class="flex items-center gap-2 mb-6">
          <RotateCcw :size="18" class="text-primary" />
          <h3 class="text-lg font-semibold">会话重置</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium">重置模式</label>
            <select v-model="form.session_reset.mode"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="both">Both</option>
              <option value="idle">Idle Only</option>
              <option value="scheduled">Scheduled Only</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">空闲超时 (分钟)</label>
            <input type="number" v-model="form.session_reset.idle_minutes"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="60" max="10080" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">定时重置 (小时)</label>
            <input type="number" v-model="form.session_reset.at_hour"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              min="0" max="23" />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center glass-panel p-4">
      <div class="text-sm text-muted-foreground">
        <span v-if="hasChanges" class="text-amber-500">有未保存的更改</span>
        <span v-else>配置已是最新</span>
      </div>
      <div class="flex gap-3">
        <button @click="resetForm" class="btn-outline">重置</button>
        <button @click="saveConfig" :disabled="isSaving || !isFormValid" class="btn-primary flex items-center gap-2">
          <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          <span>{{ isSaving ? '保存中...' : '保存配置' }}</span>
        </button>
      </div>
    </div>

    <!-- Message -->
    <div v-if="message" class="glass-panel p-4 rounded-xl flex items-center gap-3"
      :class="message.type === 'success' ? 'bg-primary/10 border border-primary/30' : 'bg-red-500/10 border border-red-500/30'">
      <CheckCircle2 v-if="message.type === 'success'" class="text-primary" :size="20" />
      <AlertCircle v-else class="text-red-500" :size="20" />
      <span class="text-sm" :class="message.type === 'success' ? 'text-primary' : 'text-red-500'">{{ message.text }}</span>
    </div>

    <!-- Provider Modal -->
    <div v-if="showProviderModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeProviderModal">
      <div class="glass-panel p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold">{{ editingProviderId ? '编辑提供商' : '添加提供商' }}</h3>
          <button @click="closeProviderModal" class="p-2 hover:bg-muted rounded-lg">
            <X :size="18" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Cloud Provider Preset -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">云厂商预设</label>
            <select v-model="providerForm.preset"
              @change="applyProviderPreset"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="">自定义 (手动填写)</option>
              <option v-for="(preset, key) in cloudProviderPresets" :key="key" :value="key">
                {{ preset.name }}
              </option>
            </select>
            <p class="text-xs text-muted-foreground">选择云厂商后自动填充配置</p>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">ID <span class="text-red-400">*</span></label>
            <input type="text" v-model="providerForm.id"
              :disabled="!!editingProviderId"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              :class="{'border-red-500': providerErrors.id}"
              placeholder="如: openai, anthropic, ollama" />
            <p v-if="providerErrors.id" class="text-xs text-red-400">{{ providerErrors.id }}</p>
            <p class="text-xs text-muted-foreground">唯一标识符，创建后不可修改</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">名称</label>
            <input type="text" v-model="providerForm.name"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              placeholder="如: OpenAI, Anthropic" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">API 端点 <span class="text-red-400">*</span></label>
            <input type="text" v-model="providerForm.base_url"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              :class="{'border-red-500': providerErrors.base_url}"
              placeholder="https://api.example.com/v1" />
            <p v-if="providerErrors.base_url" class="text-xs text-red-400">{{ providerErrors.base_url }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">密钥环境变量</label>
            <input type="text" v-model="providerForm.key_env"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm font-mono"
              placeholder="API_KEY_NAME" />
            <p class="text-xs text-muted-foreground">环境变量名称，非密钥本身</p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">API 模式</label>
            <select v-model="providerForm.api_mode"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
              <option value="openai">OpenAI 兼容</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
          
          <!-- Model Selection -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">默认模型</label>
            <div class="flex gap-2">
              <select v-model="providerForm.default_model"
                class="flex-1 bg-background border border-card-border rounded-xl px-4 py-2 text-sm">
                <option value="">选择模型</option>
                <option v-for="model in availableModels" :key="model" :value="model">
                  {{ model }}
                </option>
              </select>
              <button type="button" @click="fetchModelsFromApi"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs flex items-center gap-1"
                :disabled="!providerForm.base_url || isFetchingModels">
                <Loader2 v-if="isFetchingModels" :size="12" class="animate-spin" />
                <RefreshCw v-else :size="12" />
                <span class="hidden sm:inline">获取</span>
              </button>
            </div>
            <p class="text-xs text-muted-foreground">从预设列表选择或点击获取从 API 拉取</p>
          </div>
          
          <!-- Custom Model Input -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-muted-foreground">或输入自定义模型</label>
            <input type="text" v-model="providerForm.custom_model"
              @input="providerForm.default_model = providerForm.custom_model"
              class="w-full bg-background border border-card-border rounded-xl px-4 py-2 text-sm"
              placeholder="输入不在列表中的模型名称" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeProviderModal" class="btn-outline">取消</button>
          <button @click="saveProvider" class="btn-primary">
            {{ editingProviderId ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  Cpu, Zap, Settings, TerminalSquare, Shield, FileText, Save, Loader2, CheckCircle2, AlertCircle,
  Server, Plus, Pencil, Trash2, Cloud, Download, Upload, X, Bot, Box, Palette, Volume2, Mic,
  CheckSquare, RefreshCw, Layers, Brain, RotateCcw, Eye, Search, Code, GitBranch, MessageSquare, Sparkles,
  Globe, Clock, Video, Lock
} from 'lucide-vue-next'

// Type definitions
interface ProviderConfig {
  name: string
  base_url: string
  key_env: string
  api_mode: string
  default_model?: string
}

interface ConfigData {
  model?: { provider?: string; default?: string; api_mode?: string }
  providers?: Record<string, ProviderConfig>
  fallback_model?: { provider?: string; model?: string }
  agent?: {
    max_tokens?: number
    max_turns?: number
    reasoning_effort?: string
    save_trajectories?: boolean
    gateway_timeout?: number
    verbose?: boolean
  }
  streaming?: { enabled?: boolean }
  terminal?: {
    backend?: string
    timeout?: number
    persistent_shell?: boolean
    lifetime_seconds?: number
    container_cpu?: number
    container_memory?: number
    container_disk?: number
    container_persistent?: boolean
    docker_image?: string
  }
  browser?: {
    inactivity_timeout?: number
    command_timeout?: number
    record_sessions?: boolean
    allow_private_urls?: boolean
    cdp_url?: string
    cloud_provider?: string
  }
  logging?: { level?: string; max_size_mb?: number; backup_count?: number }
  display?: {
    personality?: string
    compact?: boolean
    show_reasoning?: boolean
    show_cost?: boolean
    inline_diffs?: boolean
    bell_on_complete?: boolean
  }
  dashboard?: { theme?: string }
  tts?: { provider?: string; voice?: string }
  stt?: { enabled?: boolean; provider?: string; local_model?: string }
  voice?: {
    record_key?: string
    max_recording_seconds?: number
    silence_duration?: number
    auto_tts?: boolean
  }
  human_delay?: {
    mode?: boolean
    min_ms?: number
    max_ms?: number
  }
  mcp?: { osv_scanning?: boolean }
  security?: { redact_secrets?: boolean; tirith_enabled?: boolean }
  privacy?: { redact_pii?: boolean }
  approvals?: { mode?: string; timeout?: number }
  compression?: {
    enabled?: boolean
    threshold?: number
    target_ratio?: number
    protect_last_n?: number
  }
  memory?: {
    memory_enabled?: boolean
    user_profile_enabled?: boolean
    memory_char_limit?: number
  }
  checkpoints?: { enabled?: boolean; max_snapshots?: number }
  session_reset?: { mode?: string; idle_minutes?: number; at_hour?: number }
  auxiliary?: Record<string, { provider?: string; model?: string }>
  isRealHermesConnected?: boolean
  configPath?: string | null
}

// Tabs configuration
const tabs = [
  { id: 'model', label: '模型配置', icon: Zap },
  { id: 'agent', label: 'Agent', icon: Bot },
  { id: 'terminal', label: '终端', icon: TerminalSquare },
  { id: 'browser', label: '浏览器', icon: Globe },
  { id: 'display', label: '显示', icon: Palette },
  { id: 'security', label: '安全', icon: Shield },
  { id: 'advanced', label: '高级', icon: Settings },
]

// Cloud provider presets
const cloudProviderPresets: Record<string, {
  name: string
  base_url: string
  key_env: string
  api_mode: string
  models: string[]
}> = {
  openai: {
    name: 'OpenAI',
    base_url: 'https://api.openai.com/v1',
    key_env: 'OPENAI_API_KEY',
    api_mode: 'openai',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o1-preview']
  },
  anthropic: {
    name: 'Anthropic',
    base_url: 'https://api.anthropic.com/v1',
    key_env: 'ANTHROPIC_API_KEY',
    api_mode: 'anthropic',
    models: ['claude-sonnet-4', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  deepseek: {
    name: 'DeepSeek',
    base_url: 'https://api.deepseek.com/v1',
    key_env: 'DEEPSEEK_API_KEY',
    api_mode: 'openai',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']
  },
  jdcloud: {
    name: 'JD Cloud (京东云)',
    base_url: 'https://modelservice.jdcloud.com/coding/openai/v1',
    key_env: 'JD_CLOUD_API_KEY',
    api_mode: 'openai',
    models: ['GLM-4', 'GLM-4-Plus', 'GLM-4-Flash', 'GLM-5', 'Qwen-Turbo', 'Qwen-Plus', 'Qwen-Max', 'Yi-Large', 'Baichuan2-Turbo', 'Doubao-Pro-32k']
  },
  ctyun: {
    name: 'CTYUN (天翼云)',
    base_url: 'https://wishub-x6.ctyun.cn/v1',
    key_env: 'CTYUN_API_KEY',
    api_mode: 'openai',
    models: ['glm-4', 'glm-4-flash', 'glm-4-plus', 'glm-5', 'qwen-turbo', 'qwen-plus', 'qwen-max']
  },
  moonshot: {
    name: 'Moonshot (月之暗面)',
    base_url: 'https://api.moonshot.cn/v1',
    key_env: 'MOONSHOT_API_KEY',
    api_mode: 'openai',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  zhipu: {
    name: 'ZhiPu (智谱)',
    base_url: 'https://open.bigmodel.cn/api/paas/v4',
    key_env: 'ZHIPU_API_KEY',
    api_mode: 'openai',
    models: ['glm-4', 'glm-4-plus', 'glm-4-flash', 'glm-4-long', 'glm-4-air', 'glm-4-airx', 'glm-4v', 'glm-4v-plus']
  },
  qwen: {
    name: 'Qwen (通义千问)',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    key_env: 'DASHSCOPE_API_KEY',
    api_mode: 'openai',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext', 'qwen-long', 'qwen-vl-max', 'qwen-vl-plus']
  },
  yi: {
    name: 'Yi (零一万物)',
    base_url: 'https://api.lingyiwanwu.com/v1',
    key_env: 'YI_API_KEY',
    api_mode: 'openai',
    models: ['yi-large', 'yi-medium', 'yi-spark', 'yi-large-turbo', 'yi-large-rag', 'yi-vision']
  },
  baichuan: {
    name: 'Baichuan (百川)',
    base_url: 'https://api.baichuan-ai.com/v1',
    key_env: 'BAICHUAN_API_KEY',
    api_mode: 'openai',
    models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan3-Turbo-128k', 'Baichuan2-Turbo']
  },
  minimax: {
    name: 'MiniMax',
    base_url: 'https://api.minimax.chat/v1',
    key_env: 'MINIMAX_API_KEY',
    api_mode: 'openai',
    models: ['abab6.5-chat', 'abab6.5s-chat', 'abab5.5-chat', 'abab5.5s-chat']
  },
  siliconflow: {
    name: 'SiliconFlow',
    base_url: 'https://api.siliconflow.cn/v1',
    key_env: 'SILICONFLOW_API_KEY',
    api_mode: 'openai',
    models: ['Qwen/Qwen2.5-72B-Instruct', 'Qwen/Qwen2.5-32B-Instruct', 'deepseek-ai/DeepSeek-V2.5', 'meta-llama/Meta-Llama-3.1-405B-Instruct', 'THUDM/glm-4-9b-chat']
  },
  groq: {
    name: 'Groq',
    base_url: 'https://api.groq.com/openai/v1',
    key_env: 'GROQ_API_KEY',
    api_mode: 'openai',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.2-1b-preview', 'llama-3.2-3b-preview', 'mixtral-8x7b-32768', 'gemma2-9b-it']
  },
  together: {
    name: 'Together AI',
    base_url: 'https://api.together.xyz/v1',
    key_env: 'TOGETHER_API_KEY',
    api_mode: 'openai',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'Qwen/Qwen2.5-72B-Instruct-Turbo']
  },
  ollama: {
    name: 'Ollama (本地)',
    base_url: 'http://localhost:11434/v1',
    key_env: '',
    api_mode: 'ollama',
    models: ['llama3.2', 'llama3.1', 'llama2', 'mistral', 'codellama', 'qwen2.5', 'gemma2', 'deepseek-r1']
  }
}

// Auxiliary tasks configuration
const auxiliaryTasks = {
  vision: { label: '视觉分析', icon: Eye, placeholder: '如: gpt-4o, claude-3-opus' },
  web_extract: { label: '网页提取', icon: Search, placeholder: '如: gpt-4o-mini' },
  compression: { label: '上下文压缩', icon: Layers, placeholder: '如: gpt-4o-mini' },
  session_search: { label: '会话搜索', icon: Search, placeholder: '如: text-embedding-3-small' },
  skills_hub: { label: 'Skills Hub', icon: Code, placeholder: '如: gpt-4o-mini' },
  title_generation: { label: '标题生成', icon: MessageSquare, placeholder: '如: gpt-4o-mini' },
}

const activeTab = ref('model')
const { data: initialData } = await useFetch<ConfigData>('/api/config')

// Form state
const form = reactive({
  model: { provider: '', default: '', api_mode: 'openai' },
  providers: {} as Record<string, ProviderConfig>,
  fallback_model: { provider: '', model: '' },
  agent: {
    max_tokens: 8000,
    max_turns: 90,
    reasoning_effort: 'medium',
    save_trajectories: false,
    gateway_timeout: 1800,
    verbose: false
  },
  streaming: { enabled: false },
  terminal: {
    backend: 'local',
    timeout: 180,
    persistent_shell: true,
    lifetime_seconds: 300,
    container_cpu: 1,
    container_memory: 5120,
    container_disk: 51200,
    container_persistent: true,
    docker_image: 'nikolaik/python-nodejs:python3.11-nodejs20'
  },
  browser: {
    inactivity_timeout: 120,
    command_timeout: 30,
    record_sessions: false,
    allow_private_urls: false,
    cdp_url: '',
    cloud_provider: 'local'
  },
  logging: { level: 'INFO', max_size_mb: 5, backup_count: 3 },
  display: {
    personality: 'helpful',
    compact: false,
    show_reasoning: false,
    show_cost: false,
    inline_diffs: true,
    bell_on_complete: false
  },
  dashboard: { theme: 'default' },
  tts: { provider: 'edge', voice: 'en-US-AriaNeural' },
  stt: { enabled: true, provider: 'local', local_model: 'base' },
  voice: {
    record_key: 'ctrl+b',
    max_recording_seconds: 60,
    silence_duration: 2,
    auto_tts: false
  },
  human_delay: {
    mode: false,
    min_ms: 500,
    max_ms: 2000
  },
  mcp: { osv_scanning: true },
  security: { redact_secrets: true, tirith_enabled: true },
  privacy: { redact_pii: false },
  approvals: { mode: 'manual', timeout: 60 },
  compression: {
    enabled: true,
    threshold: 0.5,
    target_ratio: 0.2,
    protect_last_n: 20
  },
  memory: {
    memory_enabled: true,
    user_profile_enabled: true,
    memory_char_limit: 2200
  },
  checkpoints: { enabled: true, max_snapshots: 50 },
  session_reset: { mode: 'both', idle_minutes: 1440, at_hour: 4 },
  auxiliary: {
    vision: { provider: 'auto', model: '' },
    web_extract: { provider: 'auto', model: '' },
    compression: { provider: 'auto', model: '' },
    session_search: { provider: 'auto', model: '' },
    skills_hub: { provider: 'auto', model: '' },
    title_generation: { provider: 'auto', model: '' },
  }
})

// Errors state
const errors = reactive({
  model: {} as Record<string, string>
})

// Provider modal state
const showProviderModal = ref(false)
const editingProviderId = ref('')
const providerForm = reactive({
  id: '',
  name: '',
  base_url: '',
  key_env: '',
  api_mode: 'openai',
  default_model: '',
  preset: '',
  custom_model: ''
})
const providerErrors = reactive({
  id: '',
  base_url: ''
})
const isFetchingModels = ref(false)
const fetchedModels = ref<string[]>([])

// Available models (preset + fetched)
const availableModels = computed(() => {
  const preset = providerForm.preset
  if (preset && cloudProviderPresets[preset]) {
    return [...cloudProviderPresets[preset].models, ...fetchedModels.value]
  }
  return fetchedModels.value.length > 0 ? fetchedModels.value : []
})

const isSaving = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)
const originalForm = ref('')

// Computed
const currentProviderConfig = computed(() => {
  const providerId = form.model.provider
  return form.providers[providerId]
})

const ttsVoicePlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    edge: '如: en-US-AriaNeural',
    openai: '如: alloy, echo, fable',
    elevenlabs: '如: pNInz6obpgDQGcFmaJgB',
    xai: '如: eve',
    mistral: '如: c69964a6-ab8b-4f8a-9465-ec0925096ec8'
  }
  return placeholders[form.tts.provider] || ''
})

const hasChanges = computed(() => {
  return JSON.stringify(form) !== originalForm.value
})

const isFormValid = computed(() => {
  return form.model.provider && form.model.default
})

// Methods
onMounted(() => {
  if (initialData.value) {
    // Load model config
    if (initialData.value.model) {
      form.model = { ...form.model, ...initialData.value.model }
    }
    
    // Load providers
    if (initialData.value.providers) {
      form.providers = JSON.parse(JSON.stringify(initialData.value.providers))
    }
    
    // Load other configs
    if (initialData.value.fallback_model) {
      form.fallback_model = { ...form.fallback_model, ...initialData.value.fallback_model }
    }
    if (initialData.value.agent) {
      form.agent = { ...form.agent, ...initialData.value.agent }
    }
    if (initialData.value.streaming) {
      form.streaming = { ...form.streaming, ...initialData.value.streaming }
    }
    if (initialData.value.terminal) {
      form.terminal = { ...form.terminal, ...initialData.value.terminal }
    }
    if (initialData.value.browser) {
      form.browser = { ...form.browser, ...initialData.value.browser }
    }
    if (initialData.value.logging) {
      form.logging = { ...form.logging, ...initialData.value.logging }
    }
    if (initialData.value.display) {
      form.display = { ...form.display, ...initialData.value.display }
    }
    if (initialData.value.dashboard) {
      form.dashboard = { ...form.dashboard, ...initialData.value.dashboard }
    }
    if (initialData.value.tts) {
      form.tts = { ...form.tts, ...initialData.value.tts }
    }
    if (initialData.value.stt) {
      form.stt = { ...form.stt, ...initialData.value.stt }
    }
    if (initialData.value.voice) {
      form.voice = { ...form.voice, ...initialData.value.voice }
    }
    if (initialData.value.human_delay) {
      form.human_delay = { ...form.human_delay, ...initialData.value.human_delay }
    }
    if (initialData.value.mcp) {
      form.mcp = { ...form.mcp, ...initialData.value.mcp }
    }
    if (initialData.value.security) {
      form.security = { ...form.security, ...initialData.value.security }
    }
    if (initialData.value.privacy) {
      form.privacy = { ...form.privacy, ...initialData.value.privacy }
    }
    if (initialData.value.approvals) {
      form.approvals = { ...form.approvals, ...initialData.value.approvals }
    }
    if (initialData.value.compression) {
      form.compression = { ...form.compression, ...initialData.value.compression }
    }
    if (initialData.value.memory) {
      form.memory = { ...form.memory, ...initialData.value.memory }
    }
    if (initialData.value.checkpoints) {
      form.checkpoints = { ...form.checkpoints, ...initialData.value.checkpoints }
    }
    if (initialData.value.session_reset) {
      form.session_reset = { ...form.session_reset, ...initialData.value.session_reset }
    }
    if (initialData.value.auxiliary) {
      form.auxiliary = { ...form.auxiliary, ...initialData.value.auxiliary }
    }
  }
  
  // Store original form for change detection
  originalForm.value = JSON.stringify(form)
})

const resetForm = () => {
  if (initialData.value) {
    if (initialData.value.model) {
      form.model = { ...form.model, ...initialData.value.model }
    }
    if (initialData.value.providers) {
      form.providers = JSON.parse(JSON.stringify(initialData.value.providers))
    }
    // Reset other fields...
  }
  message.value = null
  errors.model = {}
}

const validateForm = () => {
  let isValid = true
  errors.model = {}
  
  if (!form.model.provider) {
    errors.model.provider = '请选择提供商'
    isValid = false
  }
  if (!form.model.default) {
    errors.model.default = '请输入模型名称'
    isValid = false
  }
  
  return isValid
}

const saveConfig = async () => {
  if (!validateForm()) return
  
  isSaving.value = true
  message.value = null
  
  try {
    await $fetch('/api/config', {
      method: 'PUT',
      body: form
    })
    message.value = { type: 'success', text: '配置已保存！部分设置需要重启 Hermes Agent 才能生效。' }
    originalForm.value = JSON.stringify(form)
  } catch (e: any) {
    message.value = { type: 'error', text: e.data?.message || '保存失败，请重试' }
  } finally {
    isSaving.value = false
  }
}

// Provider management
const openProviderModal = (id?: string) => {
  if (id) {
    editingProviderId.value = id
    const provider = form.providers[id]
    providerForm.id = id
    providerForm.name = provider.name || ''
    providerForm.base_url = provider.base_url
    providerForm.key_env = provider.key_env || ''
    providerForm.api_mode = provider.api_mode || 'openai'
    providerForm.default_model = provider.default_model || ''
    providerForm.preset = ''
    providerForm.custom_model = ''
    // Try to find matching preset
    for (const [key, preset] of Object.entries(cloudProviderPresets)) {
      if (preset.base_url === provider.base_url) {
        providerForm.preset = key
        break
      }
    }
  } else {
    editingProviderId.value = ''
    providerForm.id = ''
    providerForm.name = ''
    providerForm.base_url = ''
    providerForm.key_env = ''
    providerForm.api_mode = 'openai'
    providerForm.default_model = ''
    providerForm.preset = ''
    providerForm.custom_model = ''
  }
  fetchedModels.value = []
  providerErrors.id = ''
  providerErrors.base_url = ''
  showProviderModal.value = true
}

const closeProviderModal = () => {
  showProviderModal.value = false
}

// Apply preset when cloud provider is selected
const applyProviderPreset = () => {
  const preset = providerForm.preset
  if (preset && cloudProviderPresets[preset]) {
    const config = cloudProviderPresets[preset]
    providerForm.id = preset
    providerForm.name = config.name
    providerForm.base_url = config.base_url
    providerForm.key_env = config.key_env
    providerForm.api_mode = config.api_mode
    if (config.models.length > 0) {
      providerForm.default_model = config.models[0]
    }
    fetchedModels.value = []
  }
}

// Fetch models from API
const fetchModelsFromApi = async () => {
  if (!providerForm.base_url || isFetchingModels.value) return
  
  isFetchingModels.value = true
  fetchedModels.value = []
  
  try {
    const response = await $fetch<{ data?: Array<{ id: string }> }>('/api/models', {
      method: 'POST',
      body: {
        base_url: providerForm.base_url,
        api_mode: providerForm.api_mode
      }
    })
    
    if (response?.data) {
      fetchedModels.value = response.data.map(m => m.id)
    }
  } catch (e) {
    console.error('Failed to fetch models:', e)
  } finally {
    isFetchingModels.value = false
  }
}

const saveProvider = () => {
  // Validate
  let isValid = true
  providerErrors.id = ''
  providerErrors.base_url = ''
  
  if (!providerForm.id) {
    providerErrors.id = 'ID 不能为空'
    isValid = false
  } else if (!editingProviderId.value && providerForm.id in form.providers) {
    providerErrors.id = 'ID 已存在'
    isValid = false
  }
  
  if (!providerForm.base_url) {
    providerErrors.base_url = 'API 端点不能为空'
    isValid = false
  }
  
  if (!isValid) return
  
  // Save
  form.providers[providerForm.id] = {
    name: providerForm.name || providerForm.id,
    base_url: providerForm.base_url,
    key_env: providerForm.key_env,
    api_mode: providerForm.api_mode,
    default_model: providerForm.default_model || undefined
  }
  
  closeProviderModal()
}

const deleteProvider = (id: string) => {
  if (confirm(`确定删除提供商 "${id}"？`)) {
    delete form.providers[id]
    if (form.model.provider === id) {
      form.model.provider = ''
    }
  }
}

// Import/Export
const exportConfig = () => {
  const data = JSON.stringify(form, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hermes-config-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importConfig = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Merge imported config
    Object.assign(form, data)
    message.value = { type: 'success', text: '配置导入成功！请检查后保存。' }
  } catch (e) {
    message.value = { type: 'error', text: '导入失败：无效的配置文件格式' }
  }
  
  // Reset file input
  ;(event.target as HTMLInputElement).value = ''
}
</script>
