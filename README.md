# Melchett

A plugin-based HTTP client for NodeJS.

## `HttpClient`
The REST client, constructed using `new HttpClient(config)`. See below for the structure of the `config` object.

### Configuration
> All properties are optional.

Property | Type | Description | Default
---|---|---|---
`name` | `string` | Name to be used for logging | `http`
`timeout` | `number` | Timeout in milliseconds | `1500`
`userAgent` | `string` | Custom user agent for the client | `melchett/VERSION`
`successPredicate` | `(status: number) => boolean` | Function to determine if a response is resolved or rejected | `(status) => status >= 200 && status < 500`
`logger` | [`Logger`](#logging) | Object implementing the common logging interface (e.g. `console` or [winston](https://github.com/winstonjs/winston#readme)). If `undefined`, logging is disabled | `undefined`
`cache` | [`Cache`](#caching) | Object specifying caching options and a reference to a caching engine. If `undefined`, caching is disabled. See [caching](#caching) for more information | `undefined`

### Middleware
Additional client features are implemented as middleware. These can be opted-into by adding the relevent property for the feature to the [client configuration object](#configuration).

#### Caching
Cache the responses to idempotent requests that have a `max-age` directive. Provide an instance of [Catbox](https://github.com/hapijs/catbox#readme) as the value of `cache.store`.

> `store` is the only mandatory property.

Property | Type | Description | Default
---|---|---|---
`store` | [Catbox](https://github.com/hapijs/catbox#readme) instance | Cache engine to be used | `undefined`
`cacheTtl` | `number` | Maximum number of seconds to store responses in cache (`max-age` is preferred if its value is lower) | `7200`
`ignoreErrors` | `boolean` | Reject the response if a cache error occurs | `true`
`doNotVary` | `string[]` | Array of header names that should _not_ be varied on |  `[]`

### Logging
To enable, set the `logger` property in the client configuration object to an object that has the following functions:
* `debug`
* `error`
* `info`
* `log`
* `warn`
Each function should have the signature: `(message?: any, ...args: any[]) => void`. (e.g. `console` or [winston](https://github.com/winstonjs/winston#readme))

If enabled, the request configuration of a given request is always logged (regardless of whether the response is resolved). This log has the following structure;
```
{
    url: 'https://www.bbc.co.uk',
    client: 'http',
    type: 'upstream',
    request_id: '89dce102-2040-40b9-80ae-0a72c5aaa3db'
}
```

If the response completes successfully, the following additional structure is added to the log object:
```
{
    status_code: 200,
    content_length: '7074',
    melchett_cache: 'MISS'
}
```

Additionally, if the response was not served from cache and there is an `x-response-time` header, its value is added as:
```
{
    upstream_duration: 24.82
}
```

Alternatively, if an error occurs at some point in the request/response chain it is added to the log object. Error objects typically have the following structure:
```
{
    error_name: 'ESTATUS500',
    error_message: 'Status code 500 received',
    error_details: 'Internal Server Error'
}
```

## Contributing
To develop `melchett` as a dependency for another package, when inside the `melchett` directory run:
```
npm link
```

Then, switch into the consuming package directory and run:
```
npm link melchett
```

This will symlink `melchett` into the consumer's `node_modules` folder and allow you to make changes to `melchett` without having to commit or reinstall.

Be sure to read the [contributing document](./CONTRIBUTING.md) beforehand.