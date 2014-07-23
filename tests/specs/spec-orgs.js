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
	"saved_org_count": 0,
	"saved_user_group_uuid": '',
	"saved_user_org_uuid": '',
	"saved_org_data_object": null,
	"count_org_metadata_items": 0,
	"count_org_trigger_items": 0,
	"trigger_test_mode": false
});
// un-comment below line to run only the trigger tests
// LTC.trigger_test_mode = true;
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
describe('Delete any previous test Organization(s)', function() {
	it('Might delete an organization', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'localhost:3000/api/deleteOrganization', ['Company', 'Company 2'], 'Organization')
			.then(done);
	});
});

if (LTC.trigger_test_mode) {
	describe('Delete any previous test Group(s)', function() {
		it('Might delete a group', function(done) {
			LTH.deleteSpecificMember('localhost:3000/api/listGroups', 'localhost:3000/api/getGroup', 'localhost:3000/api/deleteGroup', ['Test Group', 'Test Group 2'], 'Group')
				.then(done);
		});
	});
}

// Now that we've cleaned up any remnants from old tests, let's grab the number of orgs for later use
describe('List All Organizations', function() {
	it('Should list all the organizations', function(done) {
		LTH.listAllMembers('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'Organization')
			.then(function(theCount) {
				LTC.saved_org_count = theCount;
				done();
			});
	});
});

// Here we're creating a temporary org for some later testing, and we grab the uuid in our done-waiting function.
describe('Create a New Organization', function() {
	it('Should create an organization', function(done) {
		this.timeout(3000);
		request.post('localhost:3000/api/createOrganization').send({
			"orgName": 'Company 2',
			"billing_email": 'rl@lucerahq.com',
			"phone": '917-545-9194',
			"street": '110 e 59th street',
			"city": 'New York',
			"state": 'NY',
			"zip": '10022'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'Company 2', 'Saving organization uuid: ', LTC.confirm_org_created, done);
		});
	});
});

// These next several tests are just to ensure we can set/delete an organization's metadata separately from its creation.
describe('Get the Organization\'s current details to check the metadata', function() {
	it('Should return an Organization metadata object', function(done) {
		request.post('localhost:3000/api/getOrganization').send(LTC.saved_org_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				count_user_org_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				LTH.showCountMessage(count_user_org_metadata_items, 'metadata item');
				done();
			});
	});
});

describe('Set an Organization\'s metadata, deep test', function() {
	it('Should re-establish the Organization metadata', function(done) {
		this.timeout(3000);
		request.post('localhost:3000/api/metadataOrganizationSet').send({
			"uuid": LTC.saved_user_org_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getOrganization', LTC.saved_org_data_object, LTC.confirm_org_metadata_deep_add, done);
		});
	});
});

describe('Delete an Organization\'s metadata, deep test', function() {
	it('Should delete the Organization metadata', function(done) {
		this.timeout(3000);
		request.post('localhost:3000/api/metadataOrganizationDel').send({
			"uuid": LTC.saved_user_org_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getOrganization', LTC.saved_org_data_object, LTC.confirm_org_metadata_deep_delete, done);
		});
	});
});

describe('Delete an Organization\'s metadata, shallow test', function() {
	it('Should delete the Organization metadata', function(done) {
		this.timeout(3000);
		request.post('localhost:3000/api/metadataOrganizationDelAll').send(LTC.saved_org_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getOrganization', LTC.saved_org_data_object, LTC.confirm_org_metadata_shallow_delete, done);
			});
	});
});

describe('Set an Organization\'s metadata, shallow test', function() {
	it('Should re-establish the Organization metadata', function(done) {
		this.timeout(3000);
		request.post('localhost:3000/api/metadataOrganizationSetAll').send({
			"uuid": LTC.saved_user_org_uuid,
			"orgName": '2Company 2',
			"billing_email": '2rl@lucerahq.com',
			"phone": '2917-545-9194',
			"street": '2110 e 59th street',
			"city": '2New York',
			"state": '2NY',
			"zip": '210022'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getOrganization', LTC.saved_org_data_object, LTC.confirm_org_metadata_shallow_add, done);
		});
	});
});

if (LTC.trigger_test_mode) {
	// Testing organization triggers - which also require a group..

	// Here we're creating a temporary group.
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

	// The actual trigger tests.
	describe('List Organization Triggers', function() {
		it('Should list the triggers', function(done) {
			request.post('localhost:3000/api/listOrganizationTriggers').send(LTC.saved_org_data_object)
				.end(function(res) {
					var resArray = LTH.confirmResultIsObjectAndParse(res);
					LTC.count_org_trigger_items = LTH.objectSize(resArray);
					LTH.showCountMessage(LTC.count_org_trigger_items, 'trigger');
					done();
				});
		});
	});

	// Since we can't delete trigger items, let's not add any either..
	describe.skip('Set an Organization Trigger', function() {
		it('Should add a trigger', function(done) {
			request.post('localhost:3000/api/addOrganizationTrigger').send({
				"uuid": LTC.saved_user_org_uuid,
				"group_uuid": LTC.saved_user_group_uuid,
				"permission_group": "vm_create",
				"permission": "console"
			}).end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/listOrganizationTriggers', LTC.saved_org_data_object, LTC.confirm_org_trigger_created, done);
			});
		});
	});

	// Note: this functionality does not work yet, and will be force-skipped
	describe.skip('Remove an Organization Trigger', function() {
		it('Should delete a trigger', function(done) {
			request.post('localhost:3000/api/delOrganizationTrigger').send({
				"uuid": LTC.saved_user_org_uuid,
				"group_uuid": LTC.saved_user_group_uuid,
				"permission_group": "vm_create",
				"permission": "console"
			}).end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/listOrganizationTriggers', LTC.saved_org_data_object, LTC.confirm_org_trigger_deleted, done);
			});
		});
	});

	// Delete the test group
	describe('Delete Group', function() {
		it('Should delete the test group', function(done) {
			request.post('localhost:3000/api/deleteGroup').send({
				"uuid": LTC.saved_user_group_uuid
			}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});
}

// And, delete the test organization
describe('Delete Organization', function() {
	it('Should delete the test organization', function(done) {
		request.post('localhost:3000/api/deleteOrganization').send({
			"uuid": LTC.saved_user_org_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListCount('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'Organization', LTC.confirm_organization_deleted, done);
		});
	});
});