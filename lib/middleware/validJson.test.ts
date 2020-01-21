import { validJson } from './validJson';

const mockContext: MiddlewareContext = {
    client: { name: 'test', userAgent: 'melchett/test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get' },
};

const errorResult = {
    error_name: `ENOTJSON`,
    error_message: `Response data was not an object`
};

describe('JSON validator middleware', () => {
    it('should call next function once', async () => {
        // Arrange
        const next = jest.fn();

        // Act
        try {
            await validJson(mockContext, next);
        } catch (ex) {} // Since there's no response, the promise is rejected

        // Assert
        expect(next).toBeCalledTimes(1);
    });

    it('should reject with ENOTJSON for no response', async () => {
        // Arrange
        const next = jest.fn();

        // Assert
        await expect(validJson(mockContext, next)).rejects.toMatchObject({
            error: errorResult
        });
    });

    it('should reject with ENOTJSON for non-object response data', async () => {
        // Arrange
        const next = jest.fn();

        const context = { ...mockContext, response: { data: "failstring" } };

        // Assert
        await expect(validJson(context, next)).rejects.toMatchObject({
            error: errorResult
        });
    });

    it('should resolve with original context for valid response data', async () => {
        // Arrange
        const next = jest.fn();

        const context = { ...mockContext, response: { data: { foo: 'bar' } } };

        // Assert
        await expect(validJson(context, next)).resolves.toMatchObject(context);
    });
});
