const timeout = async (ctx: MiddlewareContext, next) => {
  await next();

  if (ctx.response && ctx.response.error && ctx.response.error.code === 'ECONNABORTED') {
    ctx.error = { error_name: 'ETIMEDOUT', error_message: 'Timeout exceeded' };
    return Promise.reject(ctx);
  }

  return ctx;
}

export { timeout }
