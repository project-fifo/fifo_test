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
LTC.setup({});
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

// Log in as the user, and save some metrics about existing entities.
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

var asynci = 0;
for (var i = 0; i < 11; i++) {
	describe('List all Users', function() {
		it('Should list all Users', function(done) {
			console.log('Running loop #' + (++asynci));
			request.post('localhost:3000/api/listUsers').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Groups', function() {
		it('Should list all Groups', function(done) {
			request.post('localhost:3000/api/listGroups').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Organizations', function() {
		it('Should list all Organizations', function(done) {
			request.post('localhost:3000/api/listOrganizations').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Hypervisors', function() {
		it('Should list all Hypervisors', function(done) {
			request.post('localhost:3000/api/listHypervisors').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all VMs', function() {
		it('Should list all VMs', function(done) {
			request.post('localhost:3000/api/listVMs').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Networks', function() {
		it('Should list all Networks', function(done) {
			request.post('localhost:3000/api/listNetworks').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all IPranges', function() {
		it('Should list all IPranges', function(done) {
			request.post('localhost:3000/api/listIPranges').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Datasets', function() {
		it('Should list all Datasets', function(done) {
			request.post('localhost:3000/api/listDatasets').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Packages', function() {
		it('Should list all Packages', function(done) {
			request.post('localhost:3000/api/listPackages').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});

	describe('List all Dtraces', function() {
		it('Should list all Dtraces', function(done) {
			request.post('localhost:3000/api/listDtraces').send({}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});
}