import { getRequestHash } from './requestHash';

describe('getRequestHash', () => {
    it('returns expected hash', async () => {
        // Arrange
        const request = { url: 'https://www.bbc.co.uk/', headers: {} };

        // Act
        const firstHash = getRequestHash(request);

        // Assert
        expect(firstHash).toEqual('b8fce52ee56d256a1cc215b7fdd0892a7ddd6f11');
    });

    it('unique urls - unique hash', async () => {
        // Arrange
        const firstRequest = { url: 'https://www.bbc.co.uk/', headers: {} };
        const secondRequest = { url: 'https://test.bbc.co.uk/', headers: {} };

        // Act
        const firstHash = getRequestHash(firstRequest);
        const secondHash = getRequestHash(secondRequest);

        // Assert
        expect(firstHash).not.toEqual(secondHash);
    });

    it('unique query params - unique hash', async () => {
        // Arrange
        const firstRequest = { url: 'https://www.bbc.co.uk/iplayer?q=1', headers: {} };
        const secondRequest = { url: 'https://www.bbc.co.uk/iplayer?q=2', headers: {} };

        // Act
        const firstHash = getRequestHash(firstRequest);
        const secondHash = getRequestHash(secondRequest);

        // Assert
        expect(firstHash).not.toEqual(secondHash);
    });

    it('unqiue headers - unique hash', async () => {
        // Arrange
        const firstRequest = { url: 'https://www.bbc.co.uk/', headers: { Authorization: 'token-1' } };
        const secondRequest = { url: 'https://www.bbc.co.uk/', headers: { Authorization: 'token-2' } };

        // Act
        const firstHash = getRequestHash(firstRequest);
        const secondHash = getRequestHash(secondRequest);

        // Assert
        expect(firstHash).not.toEqual(secondHash);
    });

    it('case-insensitive headers - same hash', async () => {
        // Arrange
        const firstRequest = { url: 'https://www.bbc.co.uk/', headers: { Authorization: 'token-1' } };
        const secondRequest = { url: 'https://www.bbc.co.uk/', headers: { AuThOrIzAtIoN: 'token-1' } };

        // Act
        const firstHash = getRequestHash(firstRequest);
        const secondHash = getRequestHash(secondRequest);

        // Assert
        expect(firstHash).toEqual(secondHash);
    });

    it('non-varying headers - same hash', async () => {
        // Arrange
        const firstRequest = {
            url: 'https://www.bbc.co.uk/',
            headers: {
                Authorization: 'token-1',
                'X-Request-Id': '1234'
            }
        };
        const secondRequest = {
            url: 'https://www.bbc.co.uk/',
            headers: {
                Authorization: 'token-1',
                'X-Request-Id': '5678'
            }
        };

        // Act
        const firstHash = getRequestHash(firstRequest, ['x-request-id']);
        const secondHash = getRequestHash(secondRequest, ['x-request-id']);

        // Assert
        expect(firstHash).toEqual(secondHash);
    });
});
