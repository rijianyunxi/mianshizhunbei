// babel.config.js
module.exports = {
  // 核心：定义了转换规则的集合
  presets: [
    // 负责将现代 JavaScript 转换为兼容目标环境的代码
    // 必须放在第一位
    '@babel/preset-env',
    
    // 如果是 React 项目，需要添加
    // '@babel/preset-react', 
    
    // 如果是 TypeScript 项目，需要添加
    '@babel/preset-typescript', 
  ],
  
  // 核心：定义了单个的、更精细的转换规则
  plugins: [
    // 提升代码优化，避免冗余 helper
    '@babel/plugin-transform-runtime',
    
    // 处理特定非标准语法（例如：装饰器、类属性）
    // ['@babel/plugin-proposal-decorators', { 'legacy': true }],
    // ['@babel/plugin-proposal-class-properties', { 'loose': true }],
  ],
  
  // 可选：用于按环境或按文件应用不同配置
  // env: {
  //   production: { /* 生产环境配置 */ }
  // }
};