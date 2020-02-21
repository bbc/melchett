const getTimingFromHeader = (timingHeader?: string, response?: any) => {
  if (timingHeader && response && response.headers) {
    return parseFloat(response.headers[timingHeader]);
  }
}

const timer = (timeout: number, timingHeader?: string) => {
  return async (ctx: MiddlewareContext, next) => {
    ctx.time = { start: Date.now() };

    const timeoutHandle = setTimeout(() => {
      ctx.request.cancel('ETIMEDOUT');
    }, timeout);
 
    await next();

    clearTimeout(timeoutHandle);

    ctx.time.end = Date.now();
    ctx.time.elapsed = getTimingFromHeader(timingHeader, ctx.response) || ctx.time.end - ctx.time.start;
 
    if (ctx.error && ctx.error.message === 'ETIMEDOUT') {
      ctx.error = { name: 'ETIMEDOUT', message: `Timeout of ${timeout}ms exceeded` };
      return Promise.reject(ctx);
    }

    return ctx;
  }
}

export { timer }
