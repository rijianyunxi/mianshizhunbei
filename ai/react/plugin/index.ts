import type { 
  Plugin, 
  UserConfig, 
  ConfigEnv, 
  ResolvedConfig, 
  ViteDevServer 
} from "vite";
import type { 
  NormalizedInputOptions, 
  NormalizedOutputOptions, 
  OutputBundle 
} from "rollup";

export default function lifecycleLoggerPlugin(): Plugin {
  return {
    name: "vite-plugin-lifecycle-logger",

    // ==========================================
    // 阶段一：Vite 专属配置与服务器钩子
    // ==========================================
    config(config: UserConfig, env: ConfigEnv) {
      void config; // 消除 unused 警告
      console.log("🟢 [1. config] 解析用户配置前调用，当前模式:", env.command);
    },
    
    configResolved(resolvedConfig: ResolvedConfig) {
      void resolvedConfig;
      console.log("🟢 [2. configResolved] 配置解析完毕！");
    },
    
    configureServer(server: ViteDevServer) {
      void server;
      console.log(
        "🟢 [3. configureServer] 开发服务器启动，准备就绪！(仅 dev 环境执行)"
      );
    },
    
    transformIndexHtml(html: string) {
      console.log("🟢 [4. transformIndexHtml] 准备处理 index.html");
      return html; // html 被使用了，不需要 void
    },

    // ==========================================
    // 阶段二：通用钩子 (每次解析文件都会疯狂循环这三个)
    // ==========================================
    buildStart(options: NormalizedInputOptions) {
      void options;
      console.log("🔵 [5. buildStart] 开始编译流程！");
    },
    
    resolveId(source: string, importer: string | undefined) {
      void importer;
      if (source.includes("App")) {
        console.log(`🔵 [6. resolveId] 寻找模块路径: ${source}`);
      }
      return null; 
    },
    
    load(id: string) {
      // id 被使用了，不需要 void
      if (id.includes("App")) {
        console.log(`🔵 [7. load] 读取模块内容: ${id}`);
      }
      return null;
    },
    
    transform(code: string, id: string) {
      void code; 
      if (id.includes("App")) {
        console.log(`🔵 [8. transform] 转换源码 (Loader核心动作): ${id}`);
      }
      return null; 
    },

    // ==========================================
    // 阶段三：构建阶段输出钩子 (仅 build 环境执行)
    // ==========================================
    buildEnd(error?: Error) {
      // error 被使用了，不需要 void
      console.log("🟣 [9. buildEnd] 所有模块转换完毕，准备生成产物");
      if (error) console.error("构建出错了:", error);
    },
    
    generateBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      void options;
      void bundle;
      console.log("🟣 [10. generateBundle] 产物已生成在内存中，即将写入硬盘");
    },
    
    writeBundle() {
      console.log("🟣 [11. writeBundle] 文件已成功写入 dist 目录！");
    },
    
    closeBundle() {
      console.log("🟣 [12. closeBundle] 构建彻底结束，收工！");
    },
  };
}