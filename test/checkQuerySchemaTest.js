var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');

var app;
var errorMessage = 'Parameter is not valid';

// There are three ways to pass parameters to express:
// - as part of the URL
// - as GET parameter in the querystring
// - as POST parameter in the body
// These test show that req.checkQuery are only interested in req.query values, all other
// parameters will be ignored.

function validation(req, res) {
  req.checkQuery({
    'testparam': {
      notEmpty: true,
      errorMessage: errorMessage,
      isInt: true
    }
  });

  var errors = req.validationErrors();
  if (errors) {
    return res.send(errors);
  }
  res.send({ testparam: req.query.testparam });
}

function fail(body, length) {
  expect(body).to.have.length(length);
  expect(body[0]).to.have.property('msg', errorMessage);
}

function failMulti(body, length) {
  expect(body).to.have.length(length);
  expect(body[0]).to.have.property('msg', errorMessage);
  expect(body[1]).to.have.property('msg', errorMessage);
}

function pass(body) {
  expect(body).to.have.property('testparam', '42');
}

function getRoute(path, test, length, done) {
  request(app)
    .get(path)
    .end(function(err, res) {
      test(res.body, length);
      done();
    });
}

function postRoute(path, data, test, length, done) {
  request(app)
    .post(path)
    .send(data)
    .end(function(err, res) {
      test(res.body, length);
      done();
    });
}

// This before() is required in each set of tests in
// order to use a new validation function in each file
before(function() {
  delete require.cache[require.resolve('./helpers/app')];
  app = require('./helpers/app')(validation);
});

describe('#checkQuerySchema()', function() {
  describe('GET tests', function() {
    it('should return two errors when query is missing, and unrelated param is present', function(done) {
      getRoute('/test', failMulti, 2, done);
    });

    it('should return two errors when query is missing', function(done) {
      getRoute('/', failMulti, 2, done);
    });

    it('should return a success when query validates and unrelated query is present', function(done) {
      getRoute('/42?testparam=42', pass, null, done);
    });

    it('should return one error when query does not validate as int and unrelated query is present', function(done) {
      getRoute('/test?testparam=blah', fail, 1, done);
    });
  });

  describe('POST tests', function() {
    it('should return two errors when query is missing, and unrelated param is present', function(done) {
      postRoute('/test', null, failMulti, 2, done);
    });

    it('should return two errors when query is missing', function(done) {
      postRoute('/', null, failMulti, 2, done);
    });

    it('should return a success when query validates and unrelated query is present', function(done) {
      postRoute('/42?testparam=42', null, pass, null, done);
    });

    it('should return one error when query does not validate as int and unrelated query is present', function(done) {
      postRoute('/test?testparam=blah', null, fail, 1, done);
    });

    // POST only

    it('should return a success when query validates and unrelated param/body is present', function(done) {
      postRoute('/test?testparam=42', { testparam: 'posttest' }, pass, null, done);
    });

    it('should return one error when query does not validate as int and unrelated param/body is present', function(done) {
      postRoute('/test?testparam=blah', { testparam: '42' }, fail, 1, done);
    });

    it('should return two errors when query is missing and unrelated body is present', function(done) {
      postRoute('/', { testparam: '42' }, failMulti, 2, done);
    });
  });

});
