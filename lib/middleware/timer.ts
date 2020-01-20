const timer = (timingHeader?: string) => {
  const getTimingFromHeader = (response) => {
    if (timingHeader && response && response.headers) {
      return parseFloat(response.headers[timingHeader]);
    }
  }

  return async (ctx: MiddlewareContext, next) => {
    ctx.time = { start: Date.now() };
 
    await next();

    ctx.time.end = Date.now();
    ctx.time.elapsed = getTimingFromHeader(ctx.response) || ctx.time.end - ctx.time.start;
 
    if (ctx.error && ctx.error.code === 'ECONNABORTED') {
      ctx.error = { error_name: 'ETIMEDOUT', error_message: 'Timeout exceeded' };
      return Promise.reject(ctx);
    }

    return ctx;
  }
}

export { timer }
