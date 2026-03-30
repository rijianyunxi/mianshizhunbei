import { getCurrentMiniProgramRoute } from "./platform";

export function getPageUrl(): string {
  const miniProgramRoute = getCurrentMiniProgramRoute();
  if (miniProgramRoute) {
    return miniProgramRoute;
  }

  if (typeof window !== "undefined" && window.location) {
    return window.location.href;
  }

  return "unknown_environment";
}
