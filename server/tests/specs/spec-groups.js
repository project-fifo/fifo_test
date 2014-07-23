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
	"saved_group_count": 0,
	"saved_user_group_uuid": '',
	"saved_group_data_object": null,
	"saved_group_perm_count": 0,
	"count_group_metadata_items": 0
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
describe('Delete any previous test Group(s)', function() {
	it('Might delete a group', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listGroups', 'localhost:3000/api/getGroup', 'localhost:3000/api/deleteGroup', ['Test Group', 'Test Group 2'], 'Group')
			.then(done);
	});
});

// Now that we've cleaned up any remnants from old tests, let's grab the number of groups that are in the db to use in future tests
describe('List All Groups', function() {
	it('Should list all the groups', function(done) {
		LTH.listAllMembers('localhost:3000/api/listGroups', 'localhost:3000/api/getGroup', 'Group')
			.then(function(theCount) {
				LTC.saved_group_count = theCount;
				done();
			});
	});
});

// Here we're creating a temporary group for some later testing, and we grab the uuid in our done-waiting function.
describe('Create a New Group', function() {
	it('Should create a group', function(done) {
		request.post('localhost:3000/api/createGroup').send({
			"groupName": 'Test Group 2',
			"description": 'My second group is even more fun!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listGroups', 'localhost:3000/api/getGroup', 'Test Group 2', 'Saving group uuid: ', LTC.confirm_group_created, done);
		});
	});
});

// The next several tests below involve group permissions testing.
describe('List the group\'s permissions', function() {
	it('Should return a permissions object', function(done) {
		request.post('localhost:3000/api/listGroupPermissions').send(LTC.saved_group_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.saved_group_perm_count = resArray.length;
				expect(LTC.saved_group_perm_count).to.be.eql(0);
				LTH.showCountMessage(LTC.saved_group_perm_count, 'permission');
				done();
			});
	});
});

describe('Add permissions for a group', function() {
	it('Should add a permission', function(done) {
		request.post('localhost:3000/api/grantGroupPermission').send({
			"uuid": LTC.saved_user_group_uuid,
			"permission": ['users', LTC.saved_user_group_uuid, 'delete']
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listGroupPermissions', LTC.saved_group_data_object, LTC.confirm_group_permissions_added, done);
		});
	});
});

describe('Revoke permissions for a group', function() {
	it('Should revoke a permission', function(done) {
		request.post('localhost:3000/api/revokeGroupPermission').send({
			"uuid": LTC.saved_user_group_uuid,
			"permission": ['users', LTC.saved_user_group_uuid, 'delete']
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listGroupPermissions', LTC.saved_group_data_object, LTC.confirm_group_permissions_restored, done);
		});
	});
});

// These next several tests are to test deep and shallow set/delete of a groups's metadata
describe('Get the group\'s current details to check the metadata', function() {
	it('Should return a group metadata object', function(done) {
		request.post('localhost:3000/api/getGroup').send(LTC.saved_group_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_group_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				LTH.showCountMessage(LTC.count_group_metadata_items, 'metadata item');
				done();
			});
	});
});

describe('Set a group\'s metadata, deep test', function() {
	this.timeout(4000);
	it('Should re-establish the group metadata', function(done) {
		request.post('localhost:3000/api/metadataGroupSet').send({
			"uuid": LTC.saved_user_group_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getGroup', LTC.saved_group_data_object, LTC.confirm_group_metadata_deep_add, done);
		});
	});
});

describe('Delete a group\'s metadata, deep test', function() {
	it('Should delete the group metadata', function(done) {
		request.post('localhost:3000/api/metadataGroupDel').send({
			"uuid": LTC.saved_user_group_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getGroup', LTC.saved_group_data_object, LTC.confirm_group_metadata_deep_delete, done);
		});
	});
});

describe('Delete a group\'s metadata, shallow test', function() {
	it('Should delete the group metadata', function(done) {
		request.post('localhost:3000/api/metadataGroupDelAll').send(LTC.saved_group_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getGroup', LTC.saved_group_data_object, LTC.confirm_group_metadata_shallow_delete, done);
			});
	});
});

describe('Set a group\'s metadata, shallow test', function() {
	it('Should re-establish the group metadata', function(done) {
		request.post('localhost:3000/api/metadataGroupSetAll').send({
			"uuid": LTC.saved_user_group_uuid,
			"description": '2New Description'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getGroup', LTC.saved_group_data_object, LTC.confirm_group_metadata_shallow_add, done);
		});
	});
});

// And, delete the created item
describe('Delete Group', function() {
	it('Should delete the test group', function(done) {
		this.timeout(5000);
		request.post('localhost:3000/api/deleteGroup').send(LTC.saved_group_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listGroups', 'localhost:3000/api/getGroup', 'Group', LTC.confirm_group_deleted, done);
			});
	});
});