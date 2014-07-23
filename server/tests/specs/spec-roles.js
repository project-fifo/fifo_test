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
	"saved_role_count": 0,
	"saved_user_role_uuid": '',
	"saved_role_data_object": null,
	"saved_role_perm_count": 0,
	"count_role_metadata_items": 0
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
describe('Delete any previous test Role(s)', function() {
	it('Might delete a role', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'localhost:3000/api/deleteRole', ['Test Role', 'Test Role 2'], 'Role')
			.then(function() { done(); });
	});
});

// Now that we've cleaned up any remnants from old tests, let's grab the number of roles that are in the db to use in future tests
describe('List All Roles', function() {
	it('Should list all the roles', function(done) {
		LTH.listAllMembers('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'Role')
			.then(function(theCount) {
				LTC.saved_role_count = theCount;
				done();
			});
	});
});

// Here we're creating a temporary role for some later testing, and we grab the uuid in our done-waiting function.
describe('Create a New Role', function() {
	it('Should create a role', function(done) {
		request.post('localhost:3000/api/createRole').send({
			"roleName": 'Test Role 2',
			"description": 'My second role is even more fun!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'Test Role 2', 'Saving role uuid: ', LTC.confirm_role_created, done);
		});
	});
});

// The next several tests below involve role permissions testing.
describe('List the role\'s permissions', function() {
	it('Should return a permissions object', function(done) {
		request.post('localhost:3000/api/listRolePermissions').send(LTC.saved_role_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.saved_role_perm_count = resArray.length;
				expect(LTC.saved_role_perm_count).to.be.eql(0);
				LTH.showCountMessage(LTC.saved_role_perm_count, 'permission');
				done();
			});
	});
});

describe('Add permissions for a role', function() {
	it('Should add a permission', function(done) {
		request.post('localhost:3000/api/grantRolePermission').send({
			"uuid": LTC.saved_user_role_uuid,
			"permission": ['users', LTC.saved_user_role_uuid, 'delete']
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listRolePermissions', LTC.saved_role_data_object, LTC.confirm_role_permissions_added, done);
		});
	});
});

describe('Revoke permissions for a role', function() {
	it('Should revoke a permission', function(done) {
		request.post('localhost:3000/api/revokeRolePermission').send({
			"uuid": LTC.saved_user_role_uuid,
			"permission": ['users', LTC.saved_user_role_uuid, 'delete']
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listRolePermissions', LTC.saved_role_data_object, LTC.confirm_role_permissions_restored, done);
		});
	});
});

// These next several tests are to test deep and shallow set/delete of a roles's metadata
describe('Get the role\'s current details to check the metadata', function() {
	it('Should return a role metadata object', function(done) {
		request.post('localhost:3000/api/getRole').send(LTC.saved_role_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_role_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				LTH.showCountMessage(LTC.count_role_metadata_items, 'metadata item');
				done();
			});
	});
});

describe('Set a role\'s metadata, deep test', function() {
	this.timeout(4000);
	it('Should re-establish the role metadata', function(done) {
		request.post('localhost:3000/api/metadataRoleSet').send({
			"uuid": LTC.saved_user_role_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getRole', LTC.saved_role_data_object, LTC.confirm_role_metadata_deep_add, done);
		});
	});
});

describe('Delete a role\'s metadata, deep test', function() {
	it('Should delete the role metadata', function(done) {
		request.post('localhost:3000/api/metadataRoleDel').send({
			"uuid": LTC.saved_user_role_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getRole', LTC.saved_role_data_object, LTC.confirm_role_metadata_deep_delete, done);
		});
	});
});

describe('Delete a role\'s metadata, shallow test', function() {
	it('Should delete the role metadata', function(done) {
		request.post('localhost:3000/api/metadataRoleDelAll').send(LTC.saved_role_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getRole', LTC.saved_role_data_object, LTC.confirm_role_metadata_shallow_delete, done);
			});
	});
});

describe('Set a role\'s metadata, shallow test', function() {
	it('Should re-establish the role metadata', function(done) {
		request.post('localhost:3000/api/metadataRoleSetAll').send({
			"uuid": LTC.saved_user_role_uuid,
			"description": '2New Description'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getRole', LTC.saved_role_data_object, LTC.confirm_role_metadata_shallow_add, done);
		});
	});
});

// And, delete the created item
describe('Delete Role', function() {
	it('Should delete the test role', function(done) {
		this.timeout(5000);
		request.post('localhost:3000/api/deleteRole').send(LTC.saved_role_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'Role', LTC.confirm_role_deleted, done);
			});
	});
});