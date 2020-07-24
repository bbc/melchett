import { circuitBreaker } from './circuitBreaker';

const defaultContext: MiddlewareContext = {
  client: { name: 'client-name', userAgent: 'melchett/test', state: {} },
  request: { method: 'get', url: 'foo' },
  response: { status: undefined }
};

let mockBreakerOpen;
const mockOpossumError = new Error('mockOpossumError');
jest.mock('opossum', () => {
  const opossum = function (fn) {
    return {
      fire: (...args) => {
        if (mockBreakerOpen) {
          throw mockOpossumError;
        }
        return fn && fn(...args);
      }
    };
  };
  opossum.isOurError = (error: unknown) => error === mockOpossumError;
  return opossum;
});

describe('Circuit breaker', () => {
  describe('when circuit is open', () => {
    let context;

    beforeEach(() => {
      context = { ...defaultContext };
      mockBreakerOpen = true;
    });

    it('should add an error to the context', async () => {
      const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: 0 });
      const next = jest.fn();

      const expected = {
        message: 'Circuit breaker is open for client-name',
        name: 'ECIRCUITBREAKER'
      };

      await expect(handler(context, next)).rejects.toMatchObject({ error: expected });
      expect(next).not.toBeCalled();
    });
  });

  describe('when circuit is closed', () => {
    let context;

    beforeEach(() => {
      context = { ...defaultContext };
      mockBreakerOpen = false;
    });

    it('should call the next function and context NOT have errors', async () => {
      const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: Infinity });
      const next = jest.fn();

      await handler({ ...context, response: { status: 200 } }, next);

      expect(next).toBeCalled();
      expect(context.error).toBeUndefined();
    });

    it('should call the next function and context NOT have errors on a 500', async () => {
      const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: Infinity });
      const next = jest.fn();

      await handler({ ...context, response: { status: 500 } }, next);

      expect(next).toBeCalled();
      expect(context.error).toBeUndefined();
    });

    it('should rethrow a user error', async () => {
      const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: Infinity });
      const mockError = new Error('mockError');

      const res = handler({ ...context, response: { status: 500 } }, () => {
        throw mockError;
      });

      await expect(res).rejects.toBe(mockError);
    });
  });
});
