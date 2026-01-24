const path = require('path');
const { context } = require('esbuild'); // 注意：使用 context API (esbuild ^0.17)
const args = require('minimist')(process.argv.slice(2));
console.log(args);
const target = args._[0]; //打包的初始目标
const pkgDir = path.resolve(__dirname, `../packages/${target}`);
const pkg = require(path.resolve(pkgDir, 'package.json'));
const outfile = path.resolve(__dirname, `../dist/${target}.js`);

// 配置 esbuild
context({
  entryPoints: [path.resolve(pkgDir, 'src/index.ts')],
  outfile,
  bundle: true, // 把所有依赖打包进一个文件
  sourcemap: true, // 🌟 关键：开启源码映射，调试时直接看 TS 源码
  format: 'esm', // 输出格式：iife, cjs, esm
  globalName: pkg.buildOptions?.name || target, // IIFE 格式下的全局变量名
  platform: 'browser', // node 环境下的输出格式为 cjs browser 环境下的输出格式为 esm
}).then((ctx) => {
  // 6. 开启监听模式
  console.log(`esbuild is watching ${target} ...`);
  return ctx.watch();
});