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
	"saved_user_count": 0,
	"saved_user_uuid": '',
	"saved_user_data_object": null,
	"saved_org_count": 0,
	"saved_user_signup_uuid": '',
	"saved_org_uuid": '',
	"saved_org_data_object": null,
	"saved_org_data_object2": null,
	"saved_user_role_uuid": '',
	"saved_role_count": 0,
	"saved_role_data_object": null,
	"saved_user_org_uuid": '',
	"saved_user_perm_count": 0,
	"saved_user_role_count": 0,
	"saved_user_org_count": 0,
	"saved_user_key_count": 0,
	"count_user_metadata_items": 0,
	"snarl_token": null,
	"cookies": null
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
			var resArray = LTH.confirmResultIsObjectAndParse(res, 1);
			LTC.saved_user_uuid = resArray.uuid;
			LTC.saved_user_data_object = {
				"uuid": LTC.saved_user_uuid
			};
			LTC.saved_user_signup_uuid = resArray.orgs.length ? resArray.orgs[0] : '';
			done();
		});
	});
});
// describe('Log in to FiFo as admin', function () {
// 	it('Should return a user object', function (done) {
// 		LTC.username = "admin";
// 		LTC.password = "2wsx@WSX";
// 		request.post('localhost:3000/api/login').send({
// 			"username": LTC.username,
// 			"password": LTC.password
// 		}).end(function (res) {
// 			var resArray = LTH.confirmResultIsObjectAndParse(res, 1);
// 			LTC.snarl_token = resArray.session;
// 			LTC.cookies = res.headers['set-cookie'][0].split(';')[0];
// 			done();
// 		});
// 	});
// });

// Let's find and erase any info from our previous tests...
describe('Delete any previous test Role(s)', function() {
	it('Might delete a role', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'localhost:3000/api/deleteRole', ['Test Role', 'Test Role 2'], 'Role')
			.then(function() { done(); });
	});
});

describe('Delete any previous test Organization(s)', function() {
	it('Might delete an organization', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'localhost:3000/api/deleteOrganization', ['Test Company', 'Test Company 2'], 'Organization')
			.then(function() { done(); });
	});
});

describe('Delete any previous test User(s)', function() {
	it('Might delete a user', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listUsers', 'localhost:3000/api/getUser', 'localhost:3000/api/deleteUser', 'test', 'User')
			.then(function() { done(); });
	});
});

// Now that we've cleaned up any remnants from old tests, let's grab the numbers of items to confirm this is the same at the end of our tests
describe('List All Roles', function() {
	this.timeout(4000);
	it('Should list all the roles', function(done) {
		LTH.listAllMembers('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'Role')
			.then(function(the_count) {
				LTC.saved_role_count = the_count;
				done();
			});
	});
});

describe('List All Organizations', function() {
	this.timeout(4000);
	it('Should list all the organizations', function(done) {
		LTH.listAllMembers('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'Organization')
			.then(function(the_count) {
				LTC.saved_org_count = the_count;
				done();
			});
	});
});

describe('List All Users', function() {
	this.timeout(4000);
	it('Should list all the users', function(done) {
		LTH.listAllMembers('localhost:3000/api/listUsers', 'localhost:3000/api/getUser', 'User')
			.then(function(the_count) {
				LTC.saved_user_count = the_count;
				done();
			});
	});
});

// The real test - creating a user via the standard user/org signup
// describe('Signup a New User for Lucera', function () {
// 	it('Should create a user and organization', function (done) {
// 		this.timeout(4000);
// 		request.get('localhost:3000/logout').send({
// 		}).end(function (res){
// 			request.post('localhost:3000/api/signup').send({
// 				"username": 'test',
// 				"password": 'test',
// 				"orgName": 'Test Company',
// 				"first_name": 'Tester',
// 				"last_name": 'McEntry',
// 				"email": 'tm@testdomain.com',
// 				"title": 'SO',
// 				"billing_email": 'tm@testdomain.com',
// 				"phone": '888-123-1234',
// 				"street": '123 Somewhere St',
// 				"city": 'New York',
// 				"state": 'NY',
// 				"zip": '10011'
// 			}).end(function (res) {
// 				LTH.confirmResultIsObject(res);
// 				expect(res.body).to.be.eql({0:'/'});

// 				request.post('localhost:3000/api/login').send({
// 					"username": LTC.username,
// 					"password": LTC.password
// 				}).end(function (res) {
// 					var resArray = my.confirmResultIsObjectAndParse(res);
// 					console.log(resArray);
// 					LTC.saved_user_org_uuid2 = resArray.org;
// 					LTH.waitForListCount('localhost:3000/api/listUsers', 'localhost:3000/api/getUser', 'User', LTC.confirm_user_created, done);
// 				});
// 			});
// 		});
// 	});
// });

// Login as that new user
// describe('Log in to FiFo as the New User', function () {
// 	it('Should return a user object', function (done) {
// 		this.timeout(5000);
// 		request.get('localhost:3000/logout').send({
// 		}).end(function (res){
// 			Q.delay(2000).then(function() {
// 				request.post('localhost:3000/api/login').send({
// 					"username": 'test',
// 					"password": 'test'
// 				}).end(function (res) {
// 					var resArray = LTH.confirmResultIsObjectAndParse(res);
// 					// console.log(resArray);
// 					LTC.saved_user_uuid = resArray.uuid;
// 					LTC.saved_user_data_object = { "uuid": LTC.saved_user_uuid };
// 					LTC.saved_user_signup_uuid = resArray.orgs.length ? resArray.orgs[0] : '';
// 					console.log('Saving user uuid: '+LTC.saved_user_uuid);
// 					console.log('Saving org uuid: '+LTC.saved_user_signup_uuid);
// 					expect(LTC.saved_user_uuid.length).to.be.above(5);
// 					expect(LTC.saved_user_signup_uuid.length).to.be.above(5);
// 					request.get('localhost:3000/logout').send({
// 					}).end(function (res){
// 						(LTH.loginUser())(done);
// 					});
// 				});
// 			});
// 		});
// 	});
// });

// Here we're creating a temporary role for some later testing.
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

// Here we're creating a temporary org for some later testing.
describe('Create a New Organization', function() {
	it('Should create an organization', function(done) {
		request.post('localhost:3000/api/createOrganization').send({
			"orgName": 'Test Company 2',
			"billing_email": 'tm@testdomain.com',
			"phone": '917-545-9194',
			"street": '110 e 59th street',
			"city": 'New York',
			"state": 'NY',
			"zip": '10022'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'Test Company 2', 'Saving organization uuid: ', LTC.confirm_org_created, done);
		});
	});
});

// Change that user's password, and confirm we can no longer log in
// describe('Change the new user\'s password', function () {
// 	it('Should change the user\'s password', function (done) {
// 		this.timeout(4000);
// 		request.post('localhost:3000/api/changePassword').send({
// 			"uuid": LTC.saved_user_uuid,
// 			"new_password": 'test2'
// 		}).end(function (res) {
// 			LTH.confirmResultIsObject(res);
// 			expect(res.text).to.be.eql('OK');
// 			var login_object = {
// 				"username": 'test',
// 				"password": 'test'
// 			};
// 			Q.delay(250).then(function() {
// 				LTH.waitForLoginChange('localhost:3000/api/logout', 'localhost:3000/api/login', login_object, LTC.confirm_user_login_failure, done, 500);
// 			});
// 		});
// 	});
// });

// Confirm we can login with the new password
// describe('Log in to FiFo as the New User - success expected with new password', function () {
// 	this.timeout(4000);
// 	it('Should return a user object', function (done) {
// 		request.get('localhost:3000/logout').send({
// 		}).end(function (res){
// 			Q.delay(250).then(function() {
// 				request.post('localhost:3000/api/login').send({
// 					"username": 'test',
// 					"password": 'test2'
// 				}).end(function (res) {
// 					var resArray = LTH.confirmResultIsObjectAndParse(res);
// 					expect(resArray.uuid).to.be.eql(LTC.saved_user_uuid);
// 					request.get('localhost:3000/logout').send({
// 					}).end(function (res){
// 						(LTH.loginUser())(done);
// 					});
// 				});
// 			});
// 		});
// 	});
// });

// The next several tests below involve user permissions testing.
describe('List the user\'s permissions', function() {
	it('Should return a permissions object', function(done) {
		request.post('localhost:3000/api/listUserPermissions').send(LTC.saved_user_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.saved_user_perm_count = resArray.length;
				expect(LTC.saved_user_perm_count).to.be.above(0);
				LTH.showCountMessage(LTC.saved_user_perm_count, 'permission');
				done();
			});
	});
});

describe('Add permissions for a user', function() {
	it('Should add a permission', function(done) {
		request.post('localhost:3000/api/grantUserPermission').send({
			"uuid": LTC.saved_user_uuid,
			"permission": ['users', LTC.saved_user_uuid, 'delete']
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserPermissions', LTC.saved_user_data_object, LTC.confirm_user_permissions_added, done);
		});
	});
});

describe('Revoke permissions for a user', function() {
	it('Should revoke a permission', function(done) {
		request.post('localhost:3000/api/revokeUserPermission').send({
			"uuid": LTC.saved_user_uuid,
			"permission": ['users', LTC.saved_user_uuid, 'delete']
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserPermissions', LTC.saved_user_data_object, LTC.confirm_user_permissions_restored, done);
		});
	});
});

// The next several tests below involve user role testing.
describe('List the user\'s roles', function() {
	it('Should list user role membership', function(done) {
		request.post('localhost:3000/api/listUserRoles').send(LTC.saved_user_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.saved_user_role_count = resArray.length;
				LTH.showCountMessage(LTC.saved_user_role_count, 'user role');
				done();
			});
	});
});

describe('Add a role for a user', function() {
	it('Should add a role', function(done) {
		Q.delay(250).then(function() {
			request.post('localhost:3000/api/addUserRole').send({
				"uuid": LTC.saved_user_uuid,
				"role_uuid": LTC.saved_user_role_uuid
			}).end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/listUserRoles', LTC.saved_user_data_object, LTC.confirm_user_role_added, done);
			});
		});
	});
});

describe('Delete a role for a user', function() {
	it('Should delete a role', function(done) {
		request.post('localhost:3000/api/delUserRole').send({
			"uuid": LTC.saved_user_uuid,
			"role_uuid": LTC.saved_user_role_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserRoles', LTC.saved_user_data_object, LTC.confirm_user_role_deleted, done);
		});
	});
});

// The next several tests below involve user organization testing.
describe('List the user\'s Organizations', function() {
	it('Should list user organization membership', function(done) {
		request.post('localhost:3000/api/listUserOrgs').send(LTC.saved_user_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.saved_user_org_count = resArray.length;
				LTH.showCountMessage(LTC.saved_user_org_count, 'user organization');
				done();
			});
	});
});

describe('Add an organization for a user', function() {
	it('Should add an organization', function(done) {
		request.post('localhost:3000/api/addUserOrg').send({
			"uuid": LTC.saved_user_uuid,
			"org_uuid": LTC.saved_user_org_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserOrgs', LTC.saved_user_data_object, LTC.confirm_user_org_added, done);
		});
	});
});

describe('Delete an organization for a user', function() {
	it('Should delete an organization', function(done) {
		request.post('localhost:3000/api/delUserOrg').send({
			"uuid": LTC.saved_user_uuid,
			"org_uuid": LTC.saved_user_org_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserOrgs', LTC.saved_user_data_object, LTC.confirm_user_org_deleted, done);
		});
	});
});

describe('Add an active organization for a user', function() {
	it('Should add an active organization', function(done) {
		this.timeout(5000);
		request.post('localhost:3000/api/activateUserOrg').send({
			"uuid": LTC.saved_user_uuid,
			"org_uuid": LTC.saved_user_org_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserOrgs', LTC.saved_user_data_object, LTC.confirm_user_org_active, done);
		});
	});
});

describe('Delete an organization for a user again', function() {
	it('Should delete an organization', function(done) {
		request.post('localhost:3000/api/delUserOrg').send({
			"uuid": LTC.saved_user_uuid,
			"org_uuid": LTC.saved_user_org_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserOrgs', LTC.saved_user_data_object, LTC.confirm_user_org_deleted, done);
		});
	});
});

// The next several tests below involve user key testing.
// No temporary objects need to be created or deleted
describe('List the user\'s SSH Keys', function() {
	it('Should list user SSH Keys', function(done) {
		request.post('localhost:3000/api/listUserKeys').send(LTC.saved_user_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.saved_user_key_count = LTH.objectSize(resArray);
				LTH.showCountMessage(LTC.saved_user_key_count, 'user key');
				done();
			});
	});
});

describe('Add an SSH Key for a user', function() {
	it('Should add an SSH Key', function(done) {
		Q.delay(250).then(function() {
			request.post('localhost:3000/api/addUserKey').send({
				"uuid": LTC.saved_user_uuid,
				"key_id": '123',
				"key_data": '123 1234567890abcdef keyid'
			}).end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/listUserKeys', LTC.saved_user_data_object, LTC.confirm_user_key_added, done);
			});
		});
	});
});

describe('Delete an SSH Key for a user', function() {
	it('Should delete an SSH Key', function(done) {
		request.post('localhost:3000/api/delUserKey').send({
			"uuid": LTC.saved_user_uuid,
			"key_id": '123'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listUserKeys', LTC.saved_user_data_object, LTC.confirm_user_key_deleted, done);
		});
	});
});

// These next several tests are just to ensure we can set/delete a user's metadata separately from their signup.
describe('Get the user\'s current details to check the metadata', function() {
	it('Should return a user metadata object', function(done) {
		request.post('localhost:3000/api/getUser').send(LTC.saved_user_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				expect(resArray).to.be.an('object');
				LTC.count_user_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				LTH.showCountMessage(LTC.count_user_metadata_items, 'metadata item');
				done();
			});
	});
});

describe('Delete a User\'s metadata, shallow test', function() {
	it('Should delete the user metadata', function(done) {
		request.post('localhost:3000/api/metadataUserDelAll').send(LTC.saved_user_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getUser', LTC.saved_user_data_object, LTC.confirm_user_metadata_shallow_delete, done);
			});
	});
});

describe('Set a User\'s metadata, shallow test', function() {
	it('Should re-establish the user metadata', function(done) {
		request.post('localhost:3000/api/metadataUserSetAll').send({
			"uuid": LTC.saved_user_uuid,
			"email": '2tm@testdomain.com',
			"first_name": '2Tester',
			"last_name": '2McEntry',
			"title": '2SO'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getUser', LTC.saved_user_data_object, LTC.confirm_user_metadata_shallow_add, done);
		});
	});
});

describe('Set a User\'s metadata, deep test', function() {
	it('Should re-establish the user metadata', function(done) {
		request.post('localhost:3000/api/metadataUserSet').send({
			"uuid": LTC.saved_user_uuid,
			"meta_path": ["lucera3", "name"],
			"meta_data": {
				"first": 'Tester',
				"last": 'McEntry'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getUser', LTC.saved_user_data_object, LTC.confirm_user_metadata_deep_add, done);
		});
	});
});

describe('Delete a User\'s metadata, deep test', function() {
	this.timeout(4000);
	it('Should delete the user metadata', function(done) {
		request.post('localhost:3000/api/metadataUserDel').send({
			"uuid": LTC.saved_user_uuid,
			"meta_path": ["lucera3", "name", "first"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getUser', LTC.saved_user_data_object, LTC.confirm_user_metadata_deep_delete, done);
		});
	});
});

// Since that user should now be deleted, we need to login as the admin user again to confirm it worked.
// describe('Log in to FiFo as admin again', function () {
// 	it('Should return a user object', function (done) {
// 		request.get('localhost:3000/logout').send({
// 		}).end(function (res){
// 			request.post('localhost:3000/api/login').send({
// 				username: 'admin',
// 				password: 'admin'
// 			}).end(function (res) {
// 				LTH.confirmResultIsObject(res);
// 				done();
// 			});
// 		});
// 	});
// });

// We now remove our signed up user and organization
// describe('Delete the Test Signup', function () {
// 	it('Should delete a user and organization', function (done) {
// 		request.post('localhost:3000/api/deleteUser').send(LTC.saved_user_data_object)
// 		.end(function (res) {
// 			LTH.confirmResultIsObject(res);
// 			expect(res.text).to.be.eql('OK');
// 			if (LTC.saved_user_signup_uuid.length > 5)
// 			{
// 				request.post('localhost:3000/api/deleteOrganization').send({
// 					"uuid": LTC.saved_user_signup_uuid
// 				}).end(function (res2) {
// 					LTH.confirmResultIsObject(res2);
// 					expect(res2.text).to.be.eql('OK');
// 					done();
// 				});
// 			}
// 			else
// 				done();
// 		});
// 	});
// });

// And, delete the test items
describe('Delete the test Role', function() {
	it('Should delete the test role', function(done) {
		request.post('localhost:3000/api/deleteRole').send(LTC.saved_role_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listRoles', 'localhost:3000/api/getRole', 'Role', LTC.confirm_role_deleted, done);
			});
	});
});

describe('Delete the test Organization', function() {
	it('Should delete the test organization', function(done) {
		console.log(LTC.saved_org_data_object);
		request.post('localhost:3000/api/deleteOrganization').send(LTC.saved_org_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'Organization', LTC.confirm_organization_deleted, done);
			});
	});
});

// Ensure the number of users are back where we started
// describe('List All Users to confirm the delete worked', function () {
// 	it('Should list all the users', function (done) {
// 		LTH.listAllMembers('localhost:3000/api/listUsers', 'localhost:3000/api/getUser', 'User')
// 		.then(function (the_count){
// 			expect(the_count).to.be.eql(LTC.saved_user_count);
// 			done();
// 		});
// 	});
// });