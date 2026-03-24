import { MonitorSDK } from "./core/core";
import { BrowserIntegration } from "./intergrations/browser";
import { FetchIntegration } from "./intergrations/fetch";
import { XhrIntegration } from "./intergrations/xhr";

const monitor = new MonitorSDK({
  dsn: "http://172.18.21.150/dengchuan/serve/login",
  integrations: [
    new BrowserIntegration({
      enabled: false,
    }),
    new FetchIntegration(),
    new XhrIntegration(),
  ],
});

// monitor.captureMessage("Monitor SDK initialized", { module: "bootstrap" });
