
const agentErrors = async (ctx: MiddlewareContext, next) => {
    await next();

    if (ctx.error && ctx.error.code) {
        return Promise.reject({
            error: {
                error_name: ctx.error.code,
                error_message: ctx.error.message,
            }
        });
    }

    return ctx;
}

export {
    agentErrors
}