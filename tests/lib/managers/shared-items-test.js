/**
 * @fileoverview Shared Item Manager Tests
 * @author fschott
 */
'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------
var assert = require('chai').assert,
	sinon = require('sinon'),
	mockery = require('mockery'),
	leche = require('leche');

var BoxClient = require('../../../lib/box-client');


// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------
var sandbox = sinon.sandbox.create(),
	boxClientFake = leche.fake(BoxClient.prototype),
	SharedItems,
	sharedItems,
	testSharedItemURL = 'http://box.com/s/somesharedlink',
	testSharedItemPassword = 'password',
	testQS = { testQSKey: 'testQSValue' },
	MODULE_FILE_PATH = '../../../lib/managers/shared-items';


// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('SharedItems', function() {

	before(function() {
		// Enable Mockery
		mockery.enable({ useCleanCache: true });
		// Register Mocks
		mockery.registerAllowable('http-status');
		mockery.registerAllowable('../util/url-path');
		mockery.registerAllowable('../util/errors');
		mockery.registerAllowable('util');
		mockery.registerAllowable(MODULE_FILE_PATH);
	});

	beforeEach(function() {
		// Setup File Under Test
		SharedItems = require(MODULE_FILE_PATH);
		sharedItems = new SharedItems(boxClientFake);
	});

	afterEach(function() {
		sandbox.verifyAndRestore();
		mockery.resetCache();
	});

	after(function() {
		mockery.deregisterAll();
		mockery.disable();
	});

	describe('get()', function() {
		var testAuthHeader,
			expectedParams;

		beforeEach(function() {
			testAuthHeader = 'BoxApi header value';
			expectedParams = {
				qs: testQS,
				headers: {
					BoxApi: testAuthHeader
				}
			};
		});

		it('should make GET request to get shared item info when called', function() {
			sandbox.stub(boxClientFake, 'buildSharedItemAuthHeader').returns(testAuthHeader);
			sandbox.mock(boxClientFake).expects('get').withArgs('/shared_items', expectedParams);
			sharedItems.get(testSharedItemURL, testSharedItemPassword, testQS);
		});

		it('should return the shared item info when a 200 OK response is returned', function(done) {
			var responseBody = {id: '123', name: 'Some Shared Item'},
				response = {statusCode: 200, body: responseBody};

			sandbox.stub(boxClientFake, 'buildSharedItemAuthHeader').returns(testAuthHeader);
			sandbox.stub(boxClientFake, 'get')
				.withArgs('/shared_items', expectedParams)
				.yieldsAsync(null, response);

			sharedItems.get(testSharedItemURL, testSharedItemPassword, testQS, function(err, data) {
				assert.ok(!err);
				assert.strictEqual(data, responseBody, 'location header is returned');
				done();
			});
		});

		it('should return a password_missing error when a password is given and a 403 FORBIDDEN response is returned', function(done) {
			var response = {statusCode: 403};

			sandbox.stub(boxClientFake, 'buildSharedItemAuthHeader').returns(testAuthHeader);
			sandbox.stub(boxClientFake, 'get').withArgs('/shared_items').yieldsAsync(null, response);
			sharedItems.get(testSharedItemURL, null, testQS, function(err) {
				assert.ok(err);
				assert.strictEqual(err.message, 'password_missing');
				assert.strictEqual(err.statusCode, response.statusCode);
				done();
			});
		});

		it('should return a password_incorrect error when a password is given and a 403 FORBIDDEN response is returned', function(done) {
			var response = {statusCode: 403};

			sandbox.stub(boxClientFake, 'buildSharedItemAuthHeader').returns(testAuthHeader);
			sandbox.stub(boxClientFake, 'get').withArgs('/shared_items').yieldsAsync(null, response);
			sharedItems.get(testSharedItemURL, testSharedItemPassword, testQS, function(err) {
				assert.ok(err);
				assert.strictEqual(err.message, 'password_incorrect');
				assert.strictEqual(err.statusCode, response.statusCode);
				done();
			});
		});

		it('should return error when the API call returns an error', function(done) {

			var apiError = new Error('Something bad happened!');

			sandbox.stub(boxClientFake, 'buildSharedItemAuthHeader').returns(testAuthHeader);
			sandbox.stub(boxClientFake, 'get').withArgs('/shared_items').yieldsAsync(apiError);
			sharedItems.get(testSharedItemURL, testSharedItemPassword, testQS, function(err) {
				assert.equal(err, apiError);
				done();
			});
		});

		it('should return unexpected response error when the API call returns an unknown status code', function(done) {

			var response = {
				statusCode: 404
			};

			sandbox.stub(boxClientFake, 'buildSharedItemAuthHeader').returns(testAuthHeader);
			sandbox.stub(boxClientFake, 'get').withArgs('/shared_items').yieldsAsync(null, response);
			sharedItems.get(testSharedItemURL, testSharedItemPassword, testQS, function(err) {
				assert.instanceOf(err, Error);
				done();
			});
		});

	});

});
