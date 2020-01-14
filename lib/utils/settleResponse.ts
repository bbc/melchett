import { logWriter } from "./logWriter";

const settleResponse = (logger?: Logger) => (ctx: MiddlewareContext) => {
    if (!ctx.error && ctx.response && ctx.response.data) {
        if (logger) logWriter(logger, ctx);

        return Promise.resolve({
            body: ctx.response.data,
            headers: ctx.response.headers,
            status: ctx.response.status
        });
    }

    if (!ctx.error) {
        ctx.error = {
            error_name: `EUNKNOWN`,
            error_message: 'An unknown error occurred'
        }
    }

    if (logger) logWriter(logger, ctx);
 
    return Promise.reject(ctx.error);
}

export {
    settleResponse
}
