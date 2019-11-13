import { timeout } from './timeout';

const mockContext: MiddlewareContext = {
  client: { name: 'test' },
  request: { url: 'https://www.bbc.co.uk', method: 'get' },
  response: { error: { code: 'ECONNABORTED' } },
};

const errorResult = {
  error_name: 'ETIMEDOUT',
  error_message: 'Timeout exceeded',
};

describe('Timeout middleware', () => {
  it('should call next function once', async () => {
    // Arrange
    const next = jest.fn();

    // Act
    try {
      await timeout(mockContext, next);
    } catch (ex) {}

    // Assert
    expect(next).toBeCalledTimes(1);
  });

  it('should reject with ETIMEDOUT when connection aborted', async () => {
    // Arrange
    const next = jest.fn();

    // Assert
    await expect(timeout(mockContext, next)).rejects.toMatchObject({
      error: errorResult
    });
  });
})
