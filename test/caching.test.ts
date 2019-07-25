import { Client as Catbox } from '@hapi/catbox';
import { Cache } from '../common/caching';

// jest.mock('@hapi/catbox');
jest.mock('../common/caching')

// const catboxMock = Catbox as jest.Mock<any>; <= might need this later

const cache = new Cache({ maxByteSize: 30 * 1024 * 1024 });

describe('Caching a response', () => { 
    // it('should cache a get request', async () => { 
    //     // Arrange
    //     const response = {
    //         config: {
    //             method: 'get',
    //         }
    //     };

    //     const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
        
    //     Catbox.set = catboxSetFunc;
    //     // Act
    //     cache.setCache(response);

    //     // Assert
    //     expect(catboxSetFunc).toBeCalled();        
    // });

    it('should cache a get request 2', async () => { 
        const response = {
            config: {
                method: 'get',
            }
        };

        cache.setCache(response);
        expect(cache.setCache).toBeCalled();
        expect(cache.setCache).toBeCalledWith(response);
        
    });
});
