const timeout = async (ctx: MiddlewareContext, next) => {
  await next();

  if (ctx.error && ctx.error.code === 'ECONNABORTED') {
    ctx.error = { error_name: 'ETIMEDOUT', error_message: 'Timeout exceeded' };
    return Promise.reject(ctx);
  }

  return ctx;
}

export { timeout }
