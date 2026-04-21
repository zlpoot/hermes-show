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
  }
})
