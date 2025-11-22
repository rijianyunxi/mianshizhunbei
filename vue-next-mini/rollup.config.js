import resolve from '@rollup/plugin-node-resolve'        // 帮助 Rollup 查找 node_modules 中的模块
import commonjs from '@rollup/plugin-commonjs'          // 将 CommonJS 模块转换为 ES 模块
import typescript from '@rollup/plugin-typescript'      // 支持 TypeScript



export default {
  input: './packages/vue/src/index.ts',
  output: [
    {
      format: 'iife',
      name: 'Vue', 
      sourcemap: true,
      file:'./dist/vue.global.js'
    },
    // {
    //   format: 'es',
    //   sourcemap: true,
    //   file:'./dist/vue.esm.js'
    // }
  ],


  // 插件配置
  plugins: [
    // 解析 node_modules
    resolve({
      extensions: ['.mjs', '.js', '.json', '.ts', '.vue']
    }),

    // 将 CommonJS 转 ESModule
    commonjs(),

    // TypeScript 支持
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
    }),
  ],

  // 让 Rollup 处理高级模块特性
  treeshake: true,
}



























// // rollup.config.ts
// import path from 'path'
// import resolve from '@rollup/plugin-node-resolve'        // 帮助 Rollup 查找 node_modules 中的模块
// import commonjs from '@rollup/plugin-commonjs'          // 将 CommonJS 模块转换为 ES 模块
// import typescript from '@rollup/plugin-typescript'      // 支持 TypeScript
// import vue from 'rollup-plugin-vue'                     // 支持 Vue 单文件组件
// import { terser } from 'rollup-plugin-terser'           // 压缩产物
// import replace from '@rollup/plugin-replace'           // 替换环境变量
// import json from '@rollup/plugin-json'                  // 支持导入 JSON 文件
// import alias from '@rollup/plugin-alias'               // 路径别名

// // 判断是否是生产环境
// const isProd = process.env.NODE_ENV === 'production'

// export default {
//   // 输入文件，可以是单入口也可以是多入口
//   input: {
//     index: path.resolve(__dirname, 'src/index.ts'),
//     // 如果要多个入口，可以在这里添加：
//     // core: 'src/core.ts',
//     // utils: 'src/utils.ts'
//   },

//   // 输出配置
//   output: [
//     {
//       // 输出目录
//       dir: 'dist',
//       // 输出格式：ES Module
//       format: 'es',
//       // 产物文件名模板
//       entryFileNames: '[name].esm.js',
//       // 如果库需要 UMD、IIFE 也可以加：
//       // format: 'umd',
//       // name: 'MyLibrary', // UMD 必须指定全局变量名
//       sourcemap: true, // 生成 source map
//       manualChunks(id) {
//         // 手动拆包
//         if (id.includes('node_modules')) {
//           if (id.includes('vue')) return 'vue' // vue 单独打包
//           return 'vendor' // 其他第三方模块统一打包
//         }
//       },
//     },
//     {
//       dir: 'dist',
//       format: 'cjs',
//       entryFileNames: '[name].cjs.js',
//       sourcemap: true,
//     }
//   ],

//   // 外部依赖，不打包进最终产物
//   external: ['vue', 'lodash'],

//   // 插件配置
//   plugins: [
//     // 路径别名配置
//     alias({
//       entries: [
//         { find: '@', replacement: path.resolve(__dirname, 'src') },
//         { find: '@vue', replacement: path.resolve(__dirname, 'packages') }
//       ]
//     }),

//     // 解析 node_modules
//     resolve({
//       extensions: ['.mjs', '.js', '.json', '.ts', '.vue']
//     }),

//     // 将 CommonJS 转 ESModule
//     commonjs(),

//     // TypeScript 支持
//     typescript({
//       tsconfig: './tsconfig.json',
//       sourceMap: true,
//       declaration: true,
//       declarationDir: 'dist/types'
//     }),

//     // Vue SFC 支持
//     vue({
//       target: 'browser',       // 编译目标
//       preprocessStyles: true,  // 预处理 <style>，如 scss
//       css: true,               // 提取 CSS
//       template: { optimizeSSR: false }
//     }),

//     // JSON 文件支持
//     json(),

//     // 替换环境变量
//     replace({
//       preventAssignment: true,
//       'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
//     }),

//     // 压缩代码
//     isProd && terser({
//       compress: {
//         drop_console: true,
//         drop_debugger: true
//       },
//       mangle: true,
//       format: {
//         comments: false
//       },
//       // 多线程压缩
//       parallel: true
//     })
//   ],

//   // 让 Rollup 处理高级模块特性
//   treeshake: true,

//   // watch 配置（开发环境可用）
//   watch: {
//     include: 'src/**',
//     exclude: 'node_modules/**'
//   }
// }
