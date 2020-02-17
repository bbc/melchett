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
`successPredicate` | `(status: number) => boolean` | Function to determine if a response is resolved or rejected | `(status) => status >= 200 && status < 400`
`cache` | [`Cache`](#caching) | Object specifying caching options and a reference to a caching engine. If `undefined`, caching is disabled. See [caching](#caching) for more information | `undefined`
`circuitBreaker` | [`CircuitBreaker`](#circuit-breaker) | Object specifying circuit breaker options. If `undefined`, circuit breaker is disabled. See [circuit breaker](#circuit-breaker) for more information | `undefined`
`timingHeader` | `string` | Response header from which to try to parse the response time | `undefined`

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

#### Circuit breaker
If requests begin to fail (status code >= 500) add a circuit breaker to prevent subsequent requests for a predefined time period. Reduced traffic can allow the upstream time to recover. [Opossum](https://github.com/nodeshift/opossum) is used under the hood to provide this functionality. Provide configuration options on the `circuitBreaker` property of the [client configuration object](#configuration).

Valid configuration options can be found in the [Opossum documentation](https://nodeshift.dev/opossum/#circuitbreaker).

### Responses
The request configuration of a given request is always returned (regardless of whether the response is resolved). The following example shows its structure;
```
{
    request: {
        url: 'https://www.bbc.co.uk',
        client: 'http',
        type: 'upstream',
        method: 'get',
        id: '89dce102-2040-40b9-80ae-0a72c5aaa3db'
    }
}
```

If the response completes successfully, the promise is resolved and the `response` property will contain the fields shown below:
```
{
    response: {
        body: 'Here is a response that will inform, educate, and entertain',
        headers: {},
        status: 200,
        content_length: '7074',
        upstream_duration: 123,
        melchett_cache: 'MISS'
    }
}
```

Response that are not served from cache and contain a header matching the value provided in `timingHeader` have the header value added under the `upstream_duration` property.

If no `timingHeader` is provided or it was absent in the response, `melchett` will fall back to a less accurate timing calculation for the `upstream_duration` property.

If an error occurs at some point in the request/response chain, the promise is rejected with an additional `error` field as shown:
```
{
    error: {
        name: 'ESTATUS500',
        message: 'Status code 500 received',
        details: 'Internal Server Error'
    }
}
```

Rejections will still include properties under the `response` field if they are available.

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

Copyright © 2020 BBC.
