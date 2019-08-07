import { logWriter } from "./logWriter";

const settleResponse = (logger?: Logger) => (ctx: MiddlewareContext) => {
    if (logger) {
        logWriter(logger, ctx);
    }

    if (ctx.response && ctx.response.data) {
        return Promise.resolve(ctx.response.data)
    }

    if (!ctx.error) {
        ctx.error = {
            name: `EUNKNOWN`,
            message: 'An unknown error occurred'
        }
    }

    return Promise.reject(ctx.error);
}

export {
    settleResponse
}