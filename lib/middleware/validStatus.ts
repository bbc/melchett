const validStatus = (successPredicate: (status: number) => boolean) => {
  return async (ctx: MiddlewareContext, next) => {
    await next();

    if (ctx.response && ctx.response.status && !successPredicate(ctx.response.status)) {
      ctx.error = {
        name: `ESTATUS${ctx.response.status}`,
        message: `Status code ${ctx.response.status} received for ${ctx.request.url}`
      };
      return Promise.reject(ctx);
    }

    return ctx;
  };
};

export {
  validStatus
};
