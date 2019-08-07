const validJson = async (ctx: MiddlewareContext, next) => {
    await next();

    if (ctx.response && typeof ctx.response.data !== 'object') {
        ctx.error = { errorName: `ENOTJSON`, errorMessage: `Response data was not an object` }
        return Promise.reject(ctx);
    }

    return ctx;
}

export { validJson }