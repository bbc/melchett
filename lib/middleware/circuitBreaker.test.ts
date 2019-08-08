import { circuitBreaker } from './circuitBreaker';

const defaultContext: MiddlewareContext = {
    client: {
        name: 'client-name'
    },
    request: { method: 'get', url: 'foo' }
}

let isOpenCircuit = true
jest.mock('opossum', () => () => ({ opened: isOpenCircuit, fire: () => Promise.resolve() }))

describe('circuit breaker', () => {
    describe('when circuit is open', () => {
        let context
        beforeEach(() => {
            isOpenCircuit = true
            context = {...defaultContext}
        })

        it('should add an error to the context', async () => {
            const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: 0 })
            const next = jest.fn();

            await handler(context, next)

            const result = {
                message: "Circuit breaker is open for client-name",
                name: "ECIRCUITBREAKER"
            }

            expect(next).not.toBeCalled()
            expect(context.error).toEqual(result)
        })
    })

    describe('when circuit is close', () => {
        let context

        beforeEach(() => {
            isOpenCircuit = false
            context = {...defaultContext}
        })

        it('should call the next function and context NOT have errors', async () => {
            const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: Infinity })
            const next = jest.fn();

            await handler({...context, response:{status: 200}}, next)

            expect(next).toBeCalled()
            expect(context.error).toBeUndefined()
        })
    })
});