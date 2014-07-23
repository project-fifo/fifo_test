// SERVER SIDE TEST SUITE
var expect = require('expect.js'),
	app = require('../../server.js'),
	Q = require('../../../node_modules/q/q.js'),

	// include some handy test helper functions
	LTH = require('./lucera_test_helpers.js').lth(),
	request = LTH.getRequest(),

	// and some suite-specific conditionals to help some tests
	LTC = require('./lucera_test_conditionals.js').ltc(LTH);

// let's setup some vars for the conditionals to pass around
LTC.setup({
	"saved_dtrace_count": 0,
	"saved_dtrace_uuid": '',
	"saved_dtrace_data_object": null,
	"count_dtrace_metadata_items": 0
});
LTH.ltc(LTC);

// BEFORE HOOK
before(function() {
	this.server = app.appServer.listen(3000);
});

// AFTER HOOK
after(function(done) {
	this.server.close(done);
});

// TEST SUITES

// Log in as an admin
describe('Log in to FiFo as admin', function() {
	it('Should return a user object', function(done) {
		request.post('localhost:3000/api/login').send({
			"username": LTH.Config.testing.specAdminUname,
			"password": LTH.Config.testing.specAdminPword
		}).end(function(res) {
			LTH.confirmResultIsObjectAndParse(res, 1);
			done();
		});
	});
});

// Let's find and erase any info from our previous tests...
describe('Delete any previous test Dtrace(s)', function() {
	it('Might delete a Dtrace', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listDtraces', 'localhost:3000/api/getDtrace', 'localhost:3000/api/deleteDtrace', 'Test Dtrace', 'Dtrace')
			.then(done);
	});
});

describe('List All Dtraces', function() {
	it('Should list all the Dtraces', function(done) {
		LTH.listAllMembers('localhost:3000/api/listDtraces', 'localhost:3000/api/getDtrace', 'Dtrace')
			.then(function(theCount) {
				LTC.saved_dtrace_count = theCount;
				done();
			});
	});
});

describe('Add a Dtrace', function() {
	it('Should add a new Dtrace', function(done) {
		request.post('localhost:3000/api/createDtrace').send({
			"dtraceName": 'Test Dtrace',
			"script": 'test1\ntest2\ntest3\ntest4',
			"config": {
				'test_key': 'test_var'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listDtraces', 'localhost:3000/api/getDtrace', 'Test Dtrace', 'Saving dtrace uuid: ', LTC.confirm_dtrace_created, done);
		});
	});
});

// These next several tests are to set/delete a Dtrace's metadata.
describe('Get the Dtrace\'s current details to check the metadata', function() {
	it('Should return a Dtrace metadata object', function(done) {
		request.post('localhost:3000/api/getDtrace').send(LTC.saved_dtrace_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_dtrace_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				if (LTC.count_dtrace_metadata_items == 0) {
					request.post('localhost:3000/api/metadataDtraceSetAll').send({
						"uuid": LTC.saved_dtrace_uuid,
						"description": 'This is a Dtrace!'
					}).end(function(res2) {
						LTH.confirmResultIsObject(res2);
						LTC.count_dtrace_metadata_items = 1;
						LTH.showCountMessage(LTC.count_dtrace_metadata_items, 'metadata item');
						done();
					});
				} else {
					LTH.showCountMessage(LTC.count_dtrace_metadata_items, 'metadata item');
					done();
				}
			});
	});
});

describe('Set a Dtrace\'s metadata, deep test', function() {
	this.timeout(4000);
	it('Should add a key to the Dtrace metadata', function(done) {
		request.post('localhost:3000/api/metadataDtraceSet').send({
			"uuid": LTC.saved_dtrace_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getDtrace', LTC.saved_dtrace_data_object, LTC.confirm_dtrace_metadata_deep_add, done);
		});
	});
});

describe('Delete a Dtrace\'s metadata, deep test', function() {
	it('Should delete the Dtrace metadata', function(done) {
		request.post('localhost:3000/api/metadataDtraceDel').send({
			"uuid": LTC.saved_dtrace_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getDtrace', LTC.saved_dtrace_data_object, LTC.confirm_dtrace_metadata_deep_delete, done);
		});
	});
});

describe('Delete a Dtrace\'s metadata, shallow test', function() {
	it('Should delete the Dtrace metadata', function(done) {
		request.post('localhost:3000/api/metadataDtraceDelAll').send(LTC.saved_dtrace_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getDtrace', LTC.saved_dtrace_data_object, LTC.confirm_dtrace_metadata_shallow_delete, done);
			});
	});
});

describe('Set a Dtrace\'s metadata, shallow test', function() {
	it('Should re-establish the Dtrace metadata', function(done) {
		request.post('localhost:3000/api/metadataDtraceSetAll').send({
			"uuid": LTC.saved_dtrace_uuid,
			"description": 'This is a Dtrace!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getDtrace', LTC.saved_dtrace_data_object, LTC.confirm_dtrace_metadata_shallow_add, done);
		});
	});
});

// And, delete the created item
describe('Delete the test Dtrace', function() {
	it('Should delete a Dtrace', function(done) {
		request.post('localhost:3000/api/deleteDtrace').send(LTC.saved_dtrace_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listDtraces', 'localhost:3000/api/getDtrace', 'Dtrace', LTC.confirm_dtrace_deleted, done);
			});
	});
});