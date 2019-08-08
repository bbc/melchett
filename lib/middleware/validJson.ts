const validJson = async (ctx: MiddlewareContext, next) => {
    await next();

    if (ctx.response && typeof ctx.response.data !== 'object') {
        ctx.error = { error_name: `ENOTJSON`, error_message: `Response data was not an object` }
        return Promise.reject(ctx);
    }

    return ctx;
}

export { validJson }