export interface TrackerInstance {
  capture(payload: Partial<ErrorPayload>): void;
  captureException(error: Error, extraInfo?: Record<string, any>): void;
  setUser(user: Record<string, any>): void;
  setTag(key: string, value: string): void;
}

export interface Integration {
  name: string;
  setup: (tracker: TrackerInstance) => void; 
}

export interface SDKOptions {
  dsn: string; // 后端接收地址
  appVersion?: string; // 应用版本，方便排查是哪个版本的 Bug
  environment?: "development" | "production" | "test";
  // 拦截器
  beforeSend?: (event: ErrorPayload) => ErrorPayload | null;
}

export interface ErrorPayload {
  type: string;
  message: string;
  stack?: string | null;
  time: number;
  url: string;
  // 静态配置
  appVersion?: string;
  environment?: string;
  // 动态上下文
  user?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>; // 留给开发者塞任意数据的黑洞
}