import { createApp } from "vue";
import App from "./App.vue";
import { ErrorTracker } from "./monitor/sdk";

export const tracker = new ErrorTracker({
  dsn: "https://api.your-backend.com/logs",
  appVersion: "v1.2.0",
  environment: import.meta.env.NODE_ENV,
//   beforeSend(event) {
//     const currentToken = localStorage.getItem("token");
//     event.extra = {
//       ...event.extra,
//       token: currentToken,
//       documentCookie: document.cookie,
//       currentRoute: window.location.pathname,
//     };
//     return event;
//   },
});

createApp(App).mount("#app");
