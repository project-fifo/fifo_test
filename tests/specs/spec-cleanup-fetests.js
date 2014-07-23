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
	"usersErased": 0,
	"rolesErased": 0,
	"orgsErased": 0,
	"networksErased": 0,
	"machinesErased": 0
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
		this.timeout(8000);
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

// Let's find and erase any info from our front end tests...
describe('Delete any previous test User(s)', function() {
	it('Might delete a user', function(done) {
		this.timeout(30000);
		LTH.deleteSpecificMember('localhost:3000/api/listUsers', 'localhost:3000/api/getUser', 'localhost:3000/api/deleteUser', {match:'testpf',startswith:true}, 'User')
			.then(function(deletedCount) {
				LTC.usersErased = deletedCount;
				done();
			});
	});
});

describe('Delete any previous test Role(s)', function() {
	it('Might delete a group', function(done) {
		this.timeout(30000);
		LTH.deleteSpecificMember('localhost:3000/api/listGroups', 'localhost:3000/api/getGroup', 'localhost:3000/api/deleteGroup', {match:'testpf',startswith:true}, 'Role')
			.then(function(deletedCount) {
				LTC.rolesErased = deletedCount;
				done();
			});
	});
});

describe('Delete any previous test Organization(s)', function() {
	it('Might delete an organization', function(done) {
		this.timeout(30000);
		LTH.deleteSpecificMember('localhost:3000/api/listOrganizations', 'localhost:3000/api/getOrganization', 'localhost:3000/api/deleteOrganization', {match:'testpf',startswith:true}, 'Organization')
			.then(function(deletedCount) {
				LTC.orgsErased = deletedCount;
				done();
			});
	});
});

describe('Delete any previous test MI(s)', function() {
	it('Might delete a machine', function(done) {
		this.timeout(30000);
		LTH.deleteSpecificMemberByAlias('localhost:3000/api/listVMs', 'localhost:3000/api/getVM', 'localhost:3000/api/deleteVM', {match:'testpf',startswith:true}, 'MI')
			.then(function(deletedCount) {
				LTC.machinesErased = deletedCount;
				done();
			});
	});
});

describe('Delete any previous test Network(s)', function() {
	it('Might delete a network', function(done) {
		this.timeout(30000);
		LTH.deleteSpecificMember('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'localhost:3000/api/deleteNetwork', {match:'testpf',startswith:true}, 'Network')
			.then(function(deletedCount) {
				LTC.networksErased = deletedCount;
				done();
			});
	});
});

describe('Prints a test summary', function() {
	it('Might have deleted some things', function(done) {
		return Q.delay(500).then(function() {
			console.log(' ');
			console.log("Number of users erased: " + LTC.usersErased);
			console.log("Number of roles erased: " + LTC.rolesErased);
			console.log("Number of orgs erased: " + LTC.orgsErased);
			console.log("Number of machines erased: " + LTC.machinesErased);
			console.log("Number of networks erased: " + LTC.networksErased);
			done();
		});
	});
});
