export interface Integration {
  name: string;
  setup: (tracker: ErrorTracker) => void;
}

export interface SDKOptions {
  dsn: string;
  appVersion?: string;
  environment?: "development" | "production" | "test";
  beforeSend?: (event: ErrorPayload) => ErrorPayload | null;
  // 【新增】允许用户传入集成数组
  integrations?: Integration[]; 
}


export type ErrorPayload{
    
}