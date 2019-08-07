const validStatus = (successPredicate: (status: number) => boolean) => {
    return async (ctx: MiddlewareContext, next) => {
        await next();

        if (ctx.response && ctx.response.status && !successPredicate(ctx.response.status)) {
            ctx.error = {
                name: `ESTATUS${ctx.response.status}`,
                message: `Status code ${ctx.response.status} received`,
                details: ctx.response.message || ''
            };
        }    

        return ctx;
    }
}

export {
    validStatus
}