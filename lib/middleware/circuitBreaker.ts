import circuitBreaker from 'opossum';

const tripPredicate = (status: number) => {
    if (status < 500) {
        return Promise.resolve();
    }
    return Promise.reject();
}

const circuit = (config: CircuitBreakerConfig) => {
    return async (ctx, next) => {
        if (this.circuit.opened === true) {
            ctx.error = { errorName: `ECIRCUITBREAKER`, errorMessage: `Circuit breaker is open for ${this.config.name}` };
            return ctx;
        }
        
        await next();
        
        circuitBreaker(tripPredicate, config)
        this.circuit.fire(ctx.response.status).catch(() => { });
    }
}

export {
    circuit
}