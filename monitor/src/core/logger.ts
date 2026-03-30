export const SDK_PACKAGE_NAME = "oh-my-monitor-sdk";
export const SDK_LOG_PREFIX = `[${SDK_PACKAGE_NAME}]`;

export const sdkWarn = (message: string, ...args: unknown[]): void => {
  console.warn(`${SDK_LOG_PREFIX} ${message}`, ...args);
};

export const sdkError = (message: string, ...args: unknown[]): void => {
  console.error(`${SDK_LOG_PREFIX} ${message}`, ...args);
};
