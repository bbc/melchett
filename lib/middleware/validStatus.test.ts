import { validStatus } from './validStatus';

const mockContext: MiddlewareContext = {
    client: { name: 'test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get' },
};

const errorResult = (status: number) => {
    return {
        error_name: `ESTATUS${status}`,
        error_message: `Status code ${status} received`,
        error_details: ''
    }
};

const defaultPredicate = (status: number) => status >= 200 && status < 400;

describe('Status validator middleware', () => {
    describe('with default predicate', () => {
        let appliedValidStatus;

        beforeEach(() => {
            appliedValidStatus = validStatus(defaultPredicate);
        });

        it('should call next function once', async () => {
            // Arrange
            const next = jest.fn();
    
            // Act
            await appliedValidStatus(mockContext, next);
    
            // Assert
            expect(next).toBeCalledTimes(1);
        });
    
        it('should reject with ESTATUS404 for 404 response', async () => {
            // Arrange
            const next = jest.fn();
    
            const context = { ...mockContext, response: { status: 404 } };

            // Assert
            await expect(appliedValidStatus(context, next)).rejects.toMatchObject({
                error: errorResult(404)
            });
        });
    
        it('should resolve with original context for valid response status', async () => {
            // Arrange
            const next = jest.fn();
    
            const context = { ...mockContext, response: { status: 200 } };
    
            // Assert
            await expect(appliedValidStatus(context, next)).resolves.toMatchObject(context);
        });
    });
});