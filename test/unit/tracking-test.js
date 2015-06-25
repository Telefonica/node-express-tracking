'use strict';

var domain = require('domain'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon');

describe('Tracking Middleware Tests', function() {

  var Request = function(headers) {
    return {
      method: 'GET',
      ip: '10.128.201.134',
      originalUrl: '/test?jwt=xxx',
      get: function(name) {
        if (headers) {
          return headers[name];
        } else {
          return null;
        }
      }
    }
  };

  var Response = function() {
    var headers = {};
    return {
      set: function(name, value) {
        headers[name] = value;
      },
      get: function(name) {
        return headers[name];
      }
    }
  };

  // Generate the transactionId
  var uuidMock = {
    v4: function() {
      return '123456789';
    }
  };

  var corrHandlerMock = {
    getCorrelator: function(req) {
      return 'correlator';
    },
    setCorrelator: function(res, correlator) {
    }
  };
  var corrHandlerSpy = {
    getCorrelator: sinon.spy(corrHandlerMock, 'getCorrelator'),
    setCorrelator: sinon.spy(corrHandlerMock, 'setCorrelator')
  };

  // Generator of the corrHandler to get the correlator from the request and set it in the response
  var corrHandlerGenerator = function(header) {
    return corrHandlerMock;
  };

  var onHeadersMock = function(res, cb) {
    cb();
  };

  var TrackingMiddleware = proxyquire('../../lib/tracking', {
    'on-headers': onHeadersMock,
    'node-uuid': uuidMock,
    './correlator/jwt': corrHandlerGenerator
  });

  var testDomain;

  beforeEach(function() {
    testDomain = domain.create();
    testDomain.enter();
  });

  afterEach(function() {
    testDomain.exit();
  });

  it('should generate tracking without options using the header handler when no corr header', function(done) {
    var trackingMiddleware = new TrackingMiddleware();
    var req = new Request();
    var res = new Response();
    trackingMiddleware(req, res, function() {
      expect(process.domain.tracking).to.be.deep.equal({
        op: null,
        trans: '123456789',
        corr: '123456789'
      });
      done();
    });
  });

  it('should generate tracking with op option using the header handler when no corr header', function() {
    var trackingMiddleware = new TrackingMiddleware({op: 'testOperation'});
    var req = new Request();
    var res = new Response();
    trackingMiddleware(req, res, function() {
      expect(process.domain.tracking).to.be.deep.equal({
        op: 'testOperation',
        trans: '123456789',
        corr: '123456789'
      });
    });
  });

  it('should generate tracking without options using the header handler when corr header', function() {
    var req = new Request({'Unica-Correlator': 'test-correlator'});
    var res = new Response();
    var trackingMiddleware = new TrackingMiddleware();
    trackingMiddleware(req, res, function() {
      expect(process.domain.tracking).to.be.deep.equal({
        op: null,
        trans: '123456789',
        corr: 'test-correlator'
      });
    });
  });

  it('should generate tracking with corrHeader option using the header handler', function() {
    var req = new Request({'Corr': 'test-correlator-2'});
    var res = new Response();
    var trackingMiddleware = new TrackingMiddleware({corrHeader: 'Corr'});
    trackingMiddleware(req, res, function() {
      expect(process.domain.tracking).to.be.deep.equal({
        op: null,
        trans: '123456789',
        corr: 'test-correlator-2'
      });
    });
  });

  it('should generate tracking with isJwt option using the jwt handler', function() {
    var req = new Request();
    var res = new Response();
    var trackingMiddleware = new TrackingMiddleware({isJwt: true});
    trackingMiddleware(req, res, function() {
      expect(process.domain.tracking).to.be.deep.equal({
        op: null,
        trans: '123456789',
        corr: 'correlator'
      });
      expect(corrHandlerSpy.getCorrelator.calledWith(req)).to.be.true;
      expect(corrHandlerSpy.setCorrelator.calledWith(res, 'correlator')).to.be.true;
      corrHandlerSpy.getCorrelator.reset();
      corrHandlerSpy.setCorrelator.reset();
    });
  });

  it('should generate tracking with corrHandler option using a custom handler', function() {
    var req = new Request();
    var res = new Response();
    var trackingMiddleware = new TrackingMiddleware({corrHandler: corrHandlerGenerator});
    trackingMiddleware(req, res, function() {
      expect(process.domain.tracking).to.be.deep.equal({
        op: null,
        trans: '123456789',
        corr: 'correlator'
      });
      expect(corrHandlerSpy.getCorrelator.calledWith(req)).to.be.true;
      expect(corrHandlerSpy.setCorrelator.calledWith(res, 'correlator')).to.be.true;
      corrHandlerSpy.getCorrelator.reset();
      corrHandlerSpy.setCorrelator.reset();
    });
  });

});
