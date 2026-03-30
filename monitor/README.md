Simplified Chinese documentation is available in `README.zh-CN.md` in the source repository.

# oh-my-monitor-sdk

A cross-platform monitoring SDK for browser, Vue, and mini-program applications.

## Features

- JavaScript runtime error collection
- Promise rejection collection
- Fetch and XHR error collection
- React error boundary integration
- Vue application error collection
- Mini-program runtime and request error collection
- Built-in transport retry and in-memory failure queue
- Support for `beforeSend`, custom transport, and transport failure hooks

## Installation

```bash
npm install oh-my-monitor-sdk
```

## Quick Start

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

Note: `VueIntegration` hooks into `app.config.errorHandler` to capture Vue runtime errors while preserving the existing app handler.

## React

```tsx
import React from "react";
import {
  MonitorSDK,
  ReactIntegration,
} from "oh-my-monitor-sdk";

const reactIntegration = new ReactIntegration();

const monitor = new MonitorSDK({
  dsn: "https://your-report-endpoint",
  integrations: [reactIntegration],
});

class MonitorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    reactIntegration.captureError(error, errorInfo);
    this.setState({ hasError: true });
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
```

Note: React runtime errors are typically captured through Error Boundaries, so `ReactIntegration` provides `captureError()` and `createErrorHandler()` for that integration point.

## Mini Program

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

Note: The current implementation supports mini-program runtime errors, unhandled promise rejections, and `request` failure collection.

## API

### `new MonitorSDK(options)`

Core options:

- `dsn`: report endpoint
- `appVersion`: optional app version
- `environment`: optional runtime environment
- `integrations`: optional integrations list
- `beforeSend`: modify or drop an event before upload by returning `null`
- `transport`: provide a custom transport
- `transportFailureOptions`: configure retry and queue behavior for transport failures
- `onTransportError`: inspect transport failures

### Instance Methods

- `captureException(error, extraInfo?)`
- `captureMessage(message, extraInfo?, level?)`
- `track(eventName, properties?, eventType?)`
- `captureEvent(event)`
- `setUser(user)`
- `clearUser()`
- `setTag(key, value)`
- `flush()`

## Integrations

- `BrowserIntegration`: browser global error and performance metric collection
- `FetchIntegration`: fetch request error collection
- `XhrIntegration`: XMLHttpRequest error collection
- `VueIntegration`: Vue runtime error collection
- `ReactIntegration`: React error boundary collection
- `MiniProgramIntegration`: mini-program runtime and request error collection

## Build

```bash
npm run build
```

Build output:

- `dist/index.cjs`
- `dist/index.mjs`
- `dist/types`

## Publish Checklist

1. Confirm that `package.json.name` is available on npm.
2. Complete `version`, `author`, `license`, `repository`, and related metadata.
3. Run `npm run build`.
4. Publish with `npm publish`.
