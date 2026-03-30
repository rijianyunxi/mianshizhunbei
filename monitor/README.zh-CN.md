[English](./README.md) | [简体中文](./README.zh-CN.md)

# oh-my-monitor-sdk

一个支持浏览器、Vue 和小程序场景的跨端监控 SDK。

## 功能特性

- JavaScript 运行时错误采集
- Promise rejection 采集
- Fetch 与 XHR 异常采集
- Vue 应用错误采集
- 小程序运行时错误与请求异常采集
- 内置 transport 重试与内存失败队列
- 支持 `beforeSend`、自定义 transport、上传失败回调

## 安装

```bash
npm install oh-my-monitor-sdk
```

## 快速开始

```ts
import {
  BrowserIntegration,
  FetchIntegration,
  MonitorSDK,
  XhrIntegration,
} from "oh-my-monitor-sdk";

const monitor = new MonitorSDK({
  dsn: "https://your-report-endpoint",
  appVersion: "1.0.0",
  environment: "production",
  integrations: [
    new BrowserIntegration(),
    new FetchIntegration(),
    new XhrIntegration(),
  ],
});

monitor.captureMessage("sdk initialized", { module: "bootstrap" });
```

## Vue

```ts
import { createApp } from "vue";
import { MonitorSDK, VueIntegration } from "oh-my-monitor-sdk";
import App from "./App.vue";

const app = createApp(App);

const monitor = new MonitorSDK({
  dsn: "https://your-report-endpoint",
  integrations: [new VueIntegration({ app })],
});

app.mount("#app");
```

说明：`VueIntegration` 会接入 `app.config.errorHandler`，用于采集 Vue 运行时错误，并保留业务侧原有 handler。

## 小程序

```ts
import { MiniProgramIntegration, MonitorSDK } from "oh-my-monitor-sdk";

const monitor = new MonitorSDK({
  dsn: "https://your-report-endpoint",
  integrations: [
    new MiniProgramIntegration({
      request: {
        statusErrorThreshold: 400,
      },
    }),
  ],
});
```

说明：当前支持小程序运行时错误、未处理 Promise 拒绝，以及 `request` 请求异常采集。

## API

### `new MonitorSDK(options)`

核心配置：

- `dsn`：上报地址
- `appVersion`：应用版本，可选
- `environment`：运行环境，可选
- `integrations`：integrations 列表，可选
- `beforeSend`：上报前二次处理事件，可返回 `null` 丢弃
- `transport`：自定义 transport
- `transportFailureOptions`：配置上传失败后的重试与队列策略
- `onTransportError`：监听上传失败

### 实例方法

- `captureException(error, extraInfo?)`
- `captureMessage(message, extraInfo?, level?)`
- `track(eventName, properties?, eventType?)`
- `captureEvent(event)`
- `setUser(user)`
- `clearUser()`
- `setTag(key, value)`
- `flush()`

## 可用集成

- `BrowserIntegration`：浏览器全局错误与性能指标采集
- `FetchIntegration`：Fetch 请求异常采集
- `XhrIntegration`：XMLHttpRequest 异常采集
- `VueIntegration`：Vue 运行时错误采集
- `MiniProgramIntegration`：小程序错误与请求异常采集

## 构建

```bash
npm run build
```

构建产物：

- `dist/index.cjs`
- `dist/index.mjs`
- `dist/types`

## 发布检查清单

1. 确认 `package.json.name` 在 npm 上可用。
2. 补全 `version`、`author`、`license`、`repository` 等元信息。
3. 执行 `npm run build`。
4. 使用 `npm publish` 发布。
