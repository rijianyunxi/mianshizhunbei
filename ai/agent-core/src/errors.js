function messageFromUnknown(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function describeAgentError(error) {
  if (error instanceof Error) {
    if (error.cause instanceof Error && error.cause.message) {
      return `${error.message} (cause: ${error.cause.message})`;
    }
    return error.message;
  }
  return messageFromUnknown(error);
}

export async function withTimeout(promise, timeoutMs, label = 'operation') {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return promise;
  }

  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export function shouldAttemptRuntimeRecovery(error) {
  const message = describeAgentError(error).toLowerCase();
  return (
    message.includes('message role') ||
    message.includes('message_coercion_failure') ||
    message.includes('unable to coerce message') ||
    message.includes('checkpoint')
  );
}
