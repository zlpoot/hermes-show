export default defineEventHandler(async (event) => {
  const mockData = {
    stats: {
      todayCalls: 2847,
      successRate: 98.2,
      avgLatency: 45,
      p99Latency: 230
    },
    
    servers: [
      {
        id: 'mcp-001',
        name: 'filesystem',
        command: 'npx -y @modelcontextprotocol/server-filesystem',
        args: ['/home/user', '/home/user/documents'],
        env: {},
        connected: true,
        toolCount: 8,
        callCount: 1245,
        latency: 12,
        tools: ['read_file', 'write_file', 'list_directory', 'search_files', 'move_file', 'copy_file', 'delete_file', 'get_file_info']
      },
      {
        id: 'mcp-002',
        name: 'brave-search',
        command: 'npx -y @modelcontextprotocol/server-brave-search',
        args: [],
        env: { BRAVE_API_KEY: '***' },
        connected: true,
        toolCount: 3,
        callCount: 892,
        latency: 180,
        tools: ['brave_web_search', 'brave_local_search', 'brave_news_search']
      },
      {
        id: 'mcp-003',
        name: 'sqlite',
        command: 'uvx mcp-server-sqlite',
        args: ['--db-path', '/home/user/data.db'],
        env: {},
        connected: true,
        toolCount: 5,
        callCount: 456,
        latency: 8,
        tools: ['query', 'list_tables', 'describe_table', 'execute', 'create_table']
      },
      {
        id: 'mcp-004',
        name: 'github',
        command: 'npx -y @modelcontextprotocol/server-github',
        args: [],
        env: { GITHUB_TOKEN: '***' },
        connected: false,
        toolCount: 12,
        callCount: 254,
        latency: 0,
        tools: ['search_repositories', 'get_repository', 'list_issues', 'create_issue', 'create_pull_request', 'get_file_contents', 'push_files', 'create_branch', 'list_commits', 'get_commit', 'list_pull_requests', 'update_issue']
      }
    ],
    
    tools: [
      { name: 'read_file', server: 'filesystem', description: '读取文件内容', category: 'file', callCount: 523, avgTime: 8, enabled: true },
      { name: 'write_file', server: 'filesystem', description: '写入文件内容', category: 'file', callCount: 412, avgTime: 15, enabled: true },
      { name: 'list_directory', server: 'filesystem', description: '列出目录内容', category: 'file', callCount: 198, avgTime: 5, enabled: true },
      { name: 'search_files', server: 'filesystem', description: '搜索文件', category: 'file', callCount: 112, avgTime: 45, enabled: true },
      { name: 'brave_web_search', server: 'brave-search', description: 'Brave 网页搜索', category: 'web', callCount: 456, avgTime: 180, enabled: true },
      { name: 'brave_local_search', server: 'brave-search', description: 'Brave 本地搜索', category: 'web', callCount: 234, avgTime: 150, enabled: true },
      { name: 'brave_news_search', server: 'brave-search', description: 'Brave 新闻搜索', category: 'web', callCount: 202, avgTime: 160, enabled: false },
      { name: 'query', server: 'sqlite', description: '执行 SQL 查询', category: 'database', callCount: 345, avgTime: 6, enabled: true },
      { name: 'list_tables', server: 'sqlite', description: '列出所有表', category: 'database', callCount: 78, avgTime: 3, enabled: true },
      { name: 'describe_table', server: 'sqlite', description: '描述表结构', category: 'database', callCount: 33, avgTime: 2, enabled: true },
      { name: 'search_repositories', server: 'github', description: '搜索 GitHub 仓库', category: 'code', callCount: 123, avgTime: 250, enabled: true },
      { name: 'get_repository', server: 'github', description: '获取仓库信息', category: 'code', callCount: 89, avgTime: 180, enabled: true },
      { name: 'list_issues', server: 'github', description: '列出 Issues', category: 'code', callCount: 42, avgTime: 200, enabled: true }
    ],
    
    callStats: {
      total: 2847,
      success: 2795,
      failed: 32,
      timeout: 20,
      topTools: [
        { tool: 'read_file', calls: 523 },
        { tool: 'brave_web_search', calls: 456 },
        { tool: 'write_file', calls: 412 },
        { tool: 'query', calls: 345 },
        { tool: 'brave_local_search', calls: 234 }
      ]
    },
    
    isRealHermesConnected: false
  }

  return mockData
})
