export interface SDKOptions {
  dsn: string; // 后端接收地址
  appVersion?: string; // 应用版本，方便排查是哪个版本的 Bug
  environment?: "development" | "production" | "test";
  integrations?: Array<Integration>;
  // 拦截器
  beforeSend?: (event: ErrorPayload) => ErrorPayload | null;
}

export interface ErrorPayload {
  type: string; // 错误类型
  message: string; // 错误信息
  stack?: string | null; //错误栈
  time: number; // 时间
  url: string; //

  // 行列号与文件路径
  filename?: string;
  lineno?: number;
  colno?: number;
  // 版本号 环境 development production
  appVersion?: string;
  environment?: string;
  // 动态上下文 用户信息 一些额外信息 其他扩展字段
  user?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>; // 留给开发者塞任意数据的黑洞
}

export interface TrackerInstance {
  captureException(error: Error, extraInfo?: Record<string, any>): void;
  setUser(user: Record<string, any>): void;
  setTag(key: string, value: string): void;
  processPayload(partialEvent: Partial<ErrorPayload>): void;
}

export interface Integration {
  name: string;
  setup: (tracker: TrackerInstance) => void;
}
