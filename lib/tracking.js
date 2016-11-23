/**
 * @license
 * Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var uuid = require('uuid'),
    onHeaders = require('on-headers'),
    headerCorrHandler = require('./correlator/header'),
    jwtCorrHandler = require('./correlator/jwt');

var DEFAULT_CORRELATOR_HEADER = 'Unica-Correlator';

/**
 * Express middleware that initializes the correlator and transactionId, storing them in the active domain, in order
 * to use them for logging and tracking purposes. The correlator is a convenient mechanism to track an end-to-end flow,
 * while the transactionId only tracks the request/response interaction in the component.
 *
 * The middleware stores a "tracking" object in the active domain with the elements:
 * a) "trans": Transaction ID.
 * b) "corr": Correlator
 * c) "op": Operation
 *
 * The transaction ID is a generated UUID v4.
 *
 * The correlator can be obtained from:
 * a) The "corr" attribute in the JWT header (either from req.query.jwt, req.body.jwt, or req.session.jwt).
 * b) The "Unica-Correlator" HTTP header in the request.
 * c) The generated transaction ID.
 *
 * The middleware also updates the response "Unica-Correlator" header to add correlator in non-redirect responses.
 *
 * @param {Object} options
 *    Optional settings.
 * @param {String} options.op
 *    Default field op
 * @param {String} options.corrHeader
 *    Header name for correlator. By default, "Unica-Correlator".
 * @param {Boolean} options.isJwt
 *    If true, get the correlator from "corr" field of the JWT header.
 *    If false, get the correlator from corrHeader.
 *    By default, false.
 * @param {Function(corrHeader)} options.corrHandler
 *    Handler to get and set the correlator. It requires to implement two methods:
 *    - getCorrelator: Function(req)
 *    - setCorrelator: Function(res, correlator)
 *    By default, it provides 2 different handlers: based on HTTP header if isJwt is false,
 *    or based on JWT if isJwt is true.
 * @return {Function(req, res, next)}
 *    Express middleware.
 */
module.exports = function(options) {
  var op = options && options.op;
  var corrHeader = options && options.corrHeader || DEFAULT_CORRELATOR_HEADER;
  var corrHandler = options && options.corrHandler && options.corrHandler(corrHeader);
  if (!corrHandler) {
    var isJwt = options && options.isJwt;
    corrHandler = isJwt ? jwtCorrHandler(corrHeader) : headerCorrHandler(corrHeader);
  }

  function updateTrackingInfo(key, value) {
    var domain = process.domain;
    if (domain) {
      domain.tracking = domain.tracking || {};
      domain.tracking[key] = value;
    }
  }

  function updateCorrelator(res, correlator) {
    updateTrackingInfo('corr', correlator);
    onHeaders(res, function onResponse() {
      corrHandler.setCorrelator(res, correlator);
    });
  }

  return function trackingMiddleware(req, res, next) {
    updateTrackingInfo('op', op);
    var transactionId = uuid.v4();
    updateTrackingInfo('trans', transactionId);
    // Get the correlator. If not possible, assign the transactionId to the correlator
    corrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      if (err || !correlator || typeof correlator !== 'string') {
        correlator = transactionId;
      }
      updateCorrelator(res, correlator);
      return next();
    });
  };
};
