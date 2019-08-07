import { logWriter } from "./logWriter";

const settleResponse = (logger?: Logger) => (ctx: MiddlewareContext) => {
    if (logger) {
        logWriter(logger, ctx);
    }

    if (!ctx.error && ctx.response && ctx.response.data) {
        return Promise.resolve(ctx.response.data)
    }

    if (!ctx.error) {
        ctx.error = {
            errorName: `EUNKNOWN`,
            errorMessage: 'An unknown error occurred'
        }
    }

    return Promise.reject(ctx.error);
}

export {
    settleResponse
}