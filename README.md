# express-tracking

Express middleware to track the request and response storing in the domain the operation, transactionId and
correlator.

[![npm version](https://badge.fury.io/js/express-tracking.svg)](http://badge.fury.io/js/express-tracking)
[![Build Status](https://travis-ci.org/telefonica/node-express-tracking.svg)](https://travis-ci.org/telefonica/node-express-tracking)
[![Coverage Status](https://img.shields.io/coveralls/telefonica/node-express-tracking.svg)](https://coveralls.io/r/telefonica/node-express-tracking)

These values can be used by a logging system, e.g. [logops](https://github.com/telefonicaid/logops), to track all the log entries corresponding to a transaction (a request/response) by matching the transactionId or to track a flow (from one to multiple transactions) by matching the correlator.

The middleware follows this process:

* In the **request**:
  * Get or initialize the `tracking` object in the [domain](https://nodejs.org/api/domain.html). This object stores all the variables for tracking the request and response.
  * Set `op` (operation) in the `tracking` object. Its value is obtained from the middleware options, if available. Otherwise, it is set to null.
  * Set `trans` (transactionId) in the `tracking` object. Its value is a generated UUID that makes unique the request/response.
  * Set `corr` (correlator) in the `tracking` object. The middleware tries to get the correlator from the request using a correlator handler (based on HTTP header or JWT header depending on middleware options). If it is not possible to get a valid correlator, it reuses the transactionId as correlator.

* In the **response**:
   * It uses the correlator handler to set the correlator in the response. The correlator handler based on HTTP headers adds a HTTP header (`Unica-Correlator` by default) with the correlator.

## Installation

```bash
npm install express-tracking
```

## Basic usage

```js
var express = require('express'),
    expressLogging = require('express-tracking');

var app = express();
app.use(expressTracking());

app.listen(3000);
```

## Options

The express middleware may receive an object with optional settings:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| op | String | null | Name of the operation (for logging purposes) |
| corrHeader | String | Unica-Correlator | Name of the HTTP header with the correlator |
| isJwt | Boolean | false | If the handler to get the correlator from the request and set the correlator in the response is based on JWT (obtained from the `corr` field in the JWT header) or on a HTTP header. Note that this option is ignored if `corrHandler` option is set. |
| corrHandler | Function(corrHeader) | null | Function to get the correlator from the request and set the correlator in the response when the default implementations (header and JWT-based) are not enough. |

## Advanced usage

### Enabling JWT-based correlator handler

The default correlator handler is based on the HTTP header: `Unica-Correlator` (unless modified with the option `corrHeader`). To use the other correlator header, based on the `corr` field of the JWT header:

```js
app.use(expressTracking({isJwt: true}));
```

### Using a custom correlator handler

The following sample implements a custom handler to get the correlator from the query parameter `corr` instead of an HTTP header.

```js
var customCorrHandler = function(header) {
  return {
    getCorrelator: function(req, cb) {
      return cb(null, req.query.corr);
    },
    setCorrelator: function(res, correlator) {
      res.set(header, correlator);
    }
  };
}
app.use(expressTracking({corrHandler: customCorrHandler}));
```

## Full example

It is recommended to use this express middleware in combination with:

* [express-domaining](https://github.com/telefonicaid/node-express-domaining). Express middleware to automatically create and destroy a [domain](https://nodejs.org/api/domain.html).
* [express-logging](https://github.com/telefonicaid/node-express-logging). Express middleware to log each request and response.

```js
var express = require('express'),
    expressDomain = require('express-domaining'),
    expressTracking = require('express-tracking'),
    expressLogging = require('express-logging'),
    logger = require('logops');

logger.getContext = function() {
  return process.domain && process.domain.tracking;
};

var app = express();
app.use(expressDomain(logger));
app.use(expressTracking({op: 'test'}));
app.use(expressLogging(logger));

app.get('/test', function(req, res) {
  res.status(200).send();
});

app.listen(3000);
```

After launching the previous server, each HTTP request generates 2 log entries to trace the request and response:

```
time=2015-06-25T14:34:55.847Z | lvl=INFO | corr=0ad79e44-95e9-48fe-aa17-19773ebe9056 | trans=0ad79e44-95e9-48fe-aa17-19773ebe9056 | op=test | msg=Request from ::1: GET /test
time=2015-06-25T14:34:55.848Z | lvl=INFO | corr=0ad79e44-95e9-48fe-aa17-19773ebe9056 | trans=0ad79e44-95e9-48fe-aa17-19773ebe9056 | op=test | msg=Response with status 200 in 1 ms.
```

## License

Copyright 2015 [Telefónica Investigación y Desarrollo, S.A.U](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
