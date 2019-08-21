import { logWriter } from "./logWriter";

const settleResponse = (logger?: Logger) => (ctx: MiddlewareContext) => {
    if (logger) {
        logWriter(logger, ctx);
    }

    if (!ctx.error && ctx.response && ctx.response.data) {
        return Promise.resolve({
            ...ctx.response.data,
            headers: ctx.response.headers,
            status: ctx.response.status
        })
    }

    if (!ctx.error) {
        ctx.error = {
            error_name: `EUNKNOWN`,
            error_message: 'An unknown error occurred'
        }
    }

    return Promise.reject(ctx.error);
}

export {
    settleResponse
}