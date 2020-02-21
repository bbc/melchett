import CircuitBreaker from 'opossum';

const tripPredicate = (status: number) => status < 500 ? Promise.resolve() : Promise.reject();

const circuitBreakerHandler = (config: CircuitBreakerConfig) => {
    return async (ctx: MiddlewareContext, next) => {
        if (!ctx.client.state?.circuit) {
            ctx.client.state.circuit = new CircuitBreaker(tripPredicate, config);
        }

        if (ctx.client.state.circuit.opened === true) {
            ctx.error = { name: 'ECIRCUITBREAKER', message: `Circuit breaker is open for ${ctx.client.name}` };
            return Promise.reject(ctx);
        }

        await next();

        if (ctx.response) ctx.client.state.circuit.fire(ctx.response.status).catch(() => undefined);
    };
};

export {
    circuitBreakerHandler as circuitBreaker
};
