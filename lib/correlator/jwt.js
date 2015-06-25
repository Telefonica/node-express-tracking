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

var jwtUtils = require('jwt-utils');

var jwt = jwtUtils();

/**
 * Handler to get a correlator from the request and to set a correlator in the
 * response based on the corr field of a JWT header.
 *
 * @param {String} header
 *    Name of the HTTP header used in the response to store the correlator when no redirection.
 * @return {*}
 *    Object with methods: getCorrelator and setCorrelator.
 */
module.exports = function(header) {
  return {
    getCorrelator: function(req, cb) {
      var encodedToken = (req.query && req.query.jwt) || (req.body && req.body.jwt) || (req.session && req.session.jwt);
      if (encodedToken) {
        jwt.readJWTHeader(encodedToken, function onHeader(err, jwtHeader) {
          if (!err) {
            return cb(null, jwtHeader.corr);
          } else {
            return cb(err, null);
          }
        });
      } else {
        return cb(null, null);
      }
    },
    setCorrelator: function(res, correlator) {
      if (res.statusCode < 300 || res.statusCode >= 400) {
        res.set(header, correlator);
      }
    }
  };
};
