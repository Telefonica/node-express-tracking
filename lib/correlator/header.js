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

/**
 * Handler to get a correlator from the request and to set a correlator in the
 * response based on a HTTP header.
 *
 * @param {String} header
 *    Name of the HTTP header used in the request and response to store the correlator.
 * @return {*}
 *    Object with methods: getCorrelator and setCorrelator.
 */
module.exports = function(header) {
  return {
    getCorrelator: function(req, cb) {
      return cb(null, req.get(header));
    },
    setCorrelator: function(res, correlator) {
      res.set(header, correlator);
    }
  };
};
