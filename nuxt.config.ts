// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  future: {
    compatibilityVersion: 4,
  },
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Hermes Agent 控制台',
      htmlAttrs: {
        lang: 'zh-CN',
        class: 'dark' // Default to dark mode
      },
      meta: [
        { name: 'description', content: 'Hermes Agent Web Visualization Dashboard' }
      ]
    }
  },
  // 禁用 app manifest 以解决 Nuxt 3.21 + Vite 7 的兼容性问题
  experimental: {
    appManifest: false
  },
  vite: {
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'chart.js',
        'vue-chartjs',
        'lucide-vue-next',
        '@prisma/client'
      ]
    }
  },
  // 运行时配置 - 支持跨平台环境变量
  runtimeConfig: {
    // 服务端私有配置
    hermesPath: process.env.NUXT_HERMES_PATH || '',
    gatewayAllowAllUsers: process.env.NUXT_GATEWAY_ALLOW_ALL_USERS || 'false',
    weixinAllowAllUsers: process.env.NUXT_WEIXIN_ALLOW_ALL_USERS || 'false',
    weixinDmPolicy: process.env.NUXT_WEIXIN_DM_POLICY || 'pairing',
    workDir: process.env.NUXT_WORK_DIR || '',
  }
})
