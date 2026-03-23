import { ErrorTracker } from "./core/core";
import { BrowserIntegration } from "./intergrations/browser";

let errorInstance = new ErrorTracker({
  dsn: "https://yaohuo.me",
  integrations: [new BrowserIntegration()],
});

