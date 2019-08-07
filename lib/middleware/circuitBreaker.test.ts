import { circuitBreaker } from './circuitBreaker';

jest.mock('opossum', () => () => ({ opened: true, fire: () => Promise.resolve() }))

const context: MiddlewareContext = {
    client: {
        name: 'client-name'
    },
    request: { method: 'get', url: 'foo' }
}

describe('circuit breaker', () => {
    describe('when circuit is open', () => {
        it('should add an error to the context', async () => {
            const circuit = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: 0 })
            const next = jest.fn();

            await circuit(context, next)

            const result = {
                message: "Circuit breaker is open for client-name",
                name: "ECIRCUITBREAKER"
            }

            expect(next).not.toBeCalled()
            expect(context.error).toEqual(result)
        })
    })
});