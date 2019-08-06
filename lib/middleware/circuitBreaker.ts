import circuitBreaker from 'opossum';

const tripPredicate = (status: number) => {
    if (status < 500) {
        return Promise.resolve();
    }
    return Promise.reject();
}

const circuit = (config: CircuitBreakerConfig) => {
    return async (ctx, next) => {
        circuitBreaker(tripPredicate, config)
        
        if (this.circuit.opened === true) {
            return Promise.reject({ name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for ${this.config.name}` });
        }

        await next();

        this.circuit.fire(ctx.response.status).catch(() => { });
    }
}

export {
    circuit
}