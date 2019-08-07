const validStatus = (successPredicate: (status: number) => boolean) => {
    return async (ctx: MiddlewareContext, next) => {
        await next();

        if (ctx.response && ctx.response.status && !successPredicate(ctx.response.status)) {
            ctx.error = {
                errorName: `ESTATUS${ctx.response.status}`,
                errorMessage: `Status code ${ctx.response.status} received`,
                errorDetails: ctx.response.message || ''
            }
            return Promise.reject(ctx);
        }    

        return ctx;
    }
}

export {
    validStatus
}