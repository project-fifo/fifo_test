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
	"saved_package_count": 0,
	"saved_package_uuid": '',
	"saved_package_data_object": null,
	"count_package_metadata_items": 0
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
describe('Delete any previous test Package(s)', function() {
	it('Might delete a Package', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listPackages', 'localhost:3000/api/getPackage', 'localhost:3000/api/deletePackage', 'Test Package', 'Package')
			.then(function() { done(); });
	});
});

describe('List All Packages', function() {
	it('Should list all the Packages', function(done) {
		LTH.listAllMembers('localhost:3000/api/listPackages', 'localhost:3000/api/getPackage', 'Package')
			.then(function(theCount) {
				LTC.saved_package_count = theCount;
				done();
			});
	});
});

describe('Add a Package', function() {
	it('Should add a new Package', function(done) {
		request.post('localhost:3000/api/createPackage').send({
			"packageName": 'Test Package',
			"ram": 1024,
			"quota": 10,
			"cpu_cap": 100,
			"requirements": []
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listPackages', 'localhost:3000/api/getPackage', 'Test Package', 'Saving package uuid: ', LTC.confirm_package_created, done);
		});
	});
});

// These next several tests are to set/delete a Package's metadata.
describe('Get the Package\'s current details to check the metadata', function() {
	it('Should return a Package metadata object', function(done) {
		request.post('localhost:3000/api/getPackage').send(LTC.saved_package_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_package_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				if (LTC.count_package_metadata_items == 0) {
					request.post('localhost:3000/api/metadataPackageSetAll').send({
						"uuid": LTC.saved_package_uuid,
						"description": 'This is a Package!'
					}).end(function(res2) {
						LTH.confirmResultIsObject(res2);
						LTC.count_package_metadata_items = 1;
						LTH.showCountMessage(LTC.count_package_metadata_items, 'metadata item');
						done();
					});
				} else {
					LTH.showCountMessage(LTC.count_package_metadata_items, 'metadata item');
					done();
				}
			});
	});
});

describe('Set a Package\'s metadata, deep test', function() {
	it('Should re-establish the Package metadata', function(done) {
		request.post('localhost:3000/api/metadataPackageSet').send({
			"uuid": LTC.saved_package_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getPackage', LTC.saved_package_data_object, LTC.confirm_package_metadata_deep_add, done);
		});
	});
});

describe('Delete a Package\'s metadata, deep test', function() {
	it('Should delete the Package metadata', function(done) {
		request.post('localhost:3000/api/metadataPackageDel').send({
			"uuid": LTC.saved_package_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getPackage', LTC.saved_package_data_object, LTC.confirm_package_metadata_deep_delete, done);
		});
	});
});

describe('Delete a Package\'s metadata, shallow test', function() {
	it('Should delete the Package metadata', function(done) {
		request.post('localhost:3000/api/metadataPackageDelAll').send(LTC.saved_package_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getPackage', LTC.saved_package_data_object, LTC.confirm_package_metadata_shallow_delete, done);
			});
	});
});

describe('Set a Package\'s metadata, shallow test', function() {
	it('Should re-establish the Package metadata', function(done) {
		request.post('localhost:3000/api/metadataPackageSetAll').send({
			"uuid": LTC.saved_package_uuid,
			"description": 'This is a Package!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getPackage', LTC.saved_package_data_object, LTC.confirm_package_metadata_shallow_add, done);
		});
	});
});

// And, clean up from the tests
describe('Delete the test Package', function() {
	it('Should delete a Package', function(done) {
		request.post('localhost:3000/api/deletePackage').send(LTC.saved_package_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listPackages', 'localhost:3000/api/getPackage', 'Package', LTC.confirm_package_deleted, done);
			});
	});
});