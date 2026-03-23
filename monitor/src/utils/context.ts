export function getPageUrl(): string {
  // 获取跨环境的顶级全局对象
  const globalObj = typeof globalThis !== 'undefined' ? globalThis : self;

  // 使用 (globalObj as any) 绕过 TS 的严格检查
  if (typeof (globalObj as any).wx !== 'undefined' && typeof (globalObj as any).getCurrentPages === 'function') {
    try {
      const pages = (globalObj as any).getCurrentPages();
      return pages.length ? pages[pages.length - 1].route : 'app_launch';
    } catch (e) {
      return 'unknown_wx_route';
    }
  }

  // 浏览器兜底
  if (typeof window !== 'undefined' && window.location) {
    return window.location.href;
  }

  return 'unknown_environment';
}