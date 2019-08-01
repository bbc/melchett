import { createHash } from 'crypto';

const getRequestHash = (request: { url: string, headers: { [key: string]: string } }, doNotVary: string[] = []) => {
    const shasum = createHash('sha1');
    shasum.update(request.url);
    
    for (let [header, value] of Object.entries(request.headers)) {
        header = header.toLowerCase();
        value = value.toLowerCase();

        if (!~doNotVary.indexOf(header)) {
            shasum.update(`${header}:${value}`);
        }
    }

    return shasum.digest('hex');
};

export { getRequestHash };