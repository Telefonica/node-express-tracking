'use strict';

var proxyquire = require('proxyquire'),
    sinon = require('sinon');

describe('JWT Tracking Tests', function() {

  var JwtUtilsMock = function(expectedEncodedToken, headerErr, header) {
    return function() {
      return {
        readJWTHeader: function(encodedToken, cb) {
          expect(expectedEncodedToken).to.equal(encodedToken);
          cb(headerErr, header);
        }
      };
    }
  };

  var Request = function() {
    return {
      method: 'GET',
      ip: '10.128.201.134',
      originalUrl: '/test?jwt=xxx'
    }
  };

  var Response = function(statusCode) {
    var headers = {};
    return {
      statusCode: statusCode,
      set: function(name, value) {
        headers[name] = value;
      },
      get: function(name) {
        return headers[name];
      }
    }
  };

  it('should get the correlator from jwt in query parameter', function(done) {
    var jwtUtilsMock = new JwtUtilsMock('encoded_token', null, {corr: 'testCorrelatorQuery'});
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var req = new Request();
    req.query = {jwt: 'encoded_token'};
    jwtCorrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      expect(correlator).to.be.equal('testCorrelatorQuery');
      done();
    });
  });

  it('should get the correlator from jwt in body', function(done) {
    var jwtUtilsMock = new JwtUtilsMock('encoded_token', null, {corr: 'testCorrelatorBody'});
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var req = new Request();
    req.body = {jwt: 'encoded_token'};
    jwtCorrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      expect(correlator).to.be.equal('testCorrelatorBody');
      done();
    });
  });

  it('should get the correlator from jwt in session', function(done) {
    var jwtUtilsMock = new JwtUtilsMock('encoded_token', null, {corr: 'testCorrelatorSession'});
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var req = new Request();
    req.session = {jwt: 'encoded_token'};
    jwtCorrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      expect(correlator).to.be.equal('testCorrelatorSession');
      done();
    });
  });

  it('should get the correlator from jwt in session', function(done) {
    var jwtUtilsMock = new JwtUtilsMock('encoded_token', null, {corr: 'testCorrelatorSession'});
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var req = new Request();
    req.session = {jwt: 'encoded_token'};
    jwtCorrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      expect(correlator).to.be.equal('testCorrelatorSession');
      done();
    });
  });

  it('should fail getting the correlator if no jwt', function(done) {
    var jwtUtilsMock = new JwtUtilsMock('encoded_token', null, {corr: 'testCorrelatorSession'});
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var req = new Request();
    req.session = {};
    req.query = {};
    req.body = {};
    jwtCorrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      expect(correlator).to.be.null;
      done();
    });
  });

  it('should fail getting the correlator if error decoding the jwt header', function(done) {
    var error = new Error('invalid jwt');
    var jwtUtilsMock = new JwtUtilsMock('encoded_token', error);
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var req = new Request();
    req.query = {jwt: 'encoded_token'};
    jwtCorrHandler.getCorrelator(req, function onCorrelator(err, correlator) {
      expect(err).to.be.equal(error);
      expect(correlator).to.be.null;
      done();
    });
  });

  it('should skip setting the correlator if a redirection', function() {
    var jwtUtilsMock = new JwtUtilsMock();
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var res = new Response(302);
    jwtCorrHandler.setCorrelator(res, 'testCorrelator');
    expect(res.get('Test-Corr')).to.not.exist;
  });


  it('should set the correlator if not a redirection', function() {
    var jwtUtilsMock = new JwtUtilsMock();
    var JwtCorrHandler = proxyquire('../../../lib/correlator/jwt', {'jwt-utils': jwtUtilsMock});
    var jwtCorrHandler = new JwtCorrHandler('Test-Corr');
    var res = new Response(200);
    jwtCorrHandler.setCorrelator(res, 'testCorrelator200');
    expect(res.get('Test-Corr')).to.be.equal('testCorrelator200');
    var res = new Response(500);
    jwtCorrHandler.setCorrelator(res, 'testCorrelator500');
    expect(res.get('Test-Corr')).to.be.equal('testCorrelator500');
  });

});
