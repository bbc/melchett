const isValidJson = (response) => {
    if (typeof response.data !== 'object') {
        return Promise.reject({ name: `ENOTJSON`, message: `Response data was not an object` });
    }
    return response;
}

export { isValidJson }