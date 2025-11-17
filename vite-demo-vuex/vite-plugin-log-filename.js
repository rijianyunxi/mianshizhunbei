import { parse } from '@vue/compiler-sfc'

/**
 * Vite 插件：在每个 Vue 文件的 JS 模块中插入 console.log("文件名称")
 * 支持 <script> 和 <script setup>
 */
export function logFilenamePlugin(options = {}) {
  const { exclude = [/node_modules/, /dist/] } = options

  return {
    name: 'vite-plugin-log-filename',
    enforce: 'post', // 放在 vue() 插件之后

    transform(code, id) {
      // 排除 node_modules、dist 或自定义正则
      if (exclude.some((pattern) => pattern.test(id))) return null
      if (!id.endsWith('.vue')) return null
      const filename = id.split('/').pop()
      const logLine = `console.log("文件名称: ${filename}")\n`

      // 插入到 JS 模块最前面，保证浏览器运行时打印
      return {
        code: logLine + code,
        map: null
      }
    }
  }
}
