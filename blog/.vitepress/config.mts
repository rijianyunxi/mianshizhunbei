import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'Song 的博客',
  description: '记录前端学习、工程实践和成长思考',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '关于', link: '/about' }
    ],

    sidebar: {
      '/posts/': [
        {
          text: '开始写作',
          items: [
            { text: '文章列表', link: '/posts/' },
            { text: '开站第一篇', link: '/posts/first-post' },
            { text: '写作工作流', link: '/posts/writing-workflow' }
          ]
        },
        {
          text: '参考',
          items: [{ text: 'Markdown 速查', link: '/md语法' }]
        }
      ]
    },

    outline: [2, 3],

    search: {
      provider: 'local'
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    lastUpdated: {
      text: '最近更新'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '切换主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],

    footer: {
      message: 'Powered by VitePress',
      copyright: `Copyright © ${new Date().getFullYear()} Song`
    }
  }
})
