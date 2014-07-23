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
	"saved_network_count": 0,
	"saved_network_uuid": '',
	"saved_network_data_object": null,
	"saved_iprange_count": 0,
	"saved_iprange_uuid": '',
	"saved_iprange_data_object": null,
	"count_network_ipranges": 0,
	"count_network_metadata_items": 0
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
describe('Delete any previous test Network(s)', function() {
	it('Might delete a Network', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'localhost:3000/api/deleteNetwork', 'Test Network', 'Network')
			.then(function() { done(); });
	})
});

describe('Delete any previous test IPrange(s)', function() {
	it('Might delete an IPRange', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'localhost:3000/api/deleteIPrange', 'Test IPrange', 'IPrange')
			.then(function() { done(); });
	});
});

describe('List All Networks', function() {
	it('Should list all the Networks', function(done) {
		LTH.listAllMembers('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'Network')
			.then(function(theCount) {
				LTC.saved_network_count = theCount;
				done();
			});
	});
});

describe('List All IPranges', function() {
	it('Should list all the IPranges', function(done) {
		LTH.listAllMembers('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'IPrange')
			.then(function(theCount) {
				LTC.saved_iprange_count = theCount;
				done();
			});
	});
});

describe('Add an IPRange', function() {
	it('Should add a new IPrange', function(done) {
		request.post('localhost:3000/api/createIPrange').send({
			"iprangeName": "Test IPrange",
			"network": "192.168.0.0",
			"gateway": "192.168.0.1",
			"netmask": "255.255.255.0",
			"first": "192.168.0.100",
			"last": "192.168.0.200",
			"vlan": 1,
			"tag": "admin"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'Test IPrange', 'Saving IPrange uuid: ', LTC.confirm_iprange_created, done);
		});
	});
});

describe('Add a Network', function() {
	it('Should add a new Network', function(done) {
		request.post('localhost:3000/api/createNetwork').send({
			"networkName": "Test Network",
			"description": "This is a network!"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListItem('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'Test Network', 'Saving Network uuid: ', LTC.confirm_network_created, done);
		});
	});
});

// Check that we can add and delete IPranges from Networks
describe('Get the Network\'s current details to check that there are no IPranges present', function() {
	it('Should return a Network object', function(done) {
		request.post('localhost:3000/api/getNetwork').send(LTC.saved_network_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				if (eval('typeof(resArray.ipranges)') != 'undefined')
					LTC.count_network_ipranges = resArray.ipranges.length;
				LTH.showCountMessage(LTC.count_network_ipranges, 'IPrange');
				done();
			});
	});
});

describe('Add an IPrange to the test Network', function() {
	it('Should add an IPrange to a Network', function(done) {
		request.post('localhost:3000/api/addNetworkIPrange').send({
			"uuid": LTC.saved_network_uuid,
			"iprange_uuid": LTC.saved_iprange_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getNetwork', LTC.saved_network_data_object, LTC.confirm_network_iprange_added, done);
		});
	});
});

describe('Delete an IPrange from the test Network', function() {
	it('Should delete an IPrange from a Network', function(done) {
		request.post('localhost:3000/api/delNetworkIPrange').send({
			"uuid": LTC.saved_network_uuid,
			"iprange_uuid": LTC.saved_iprange_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getNetwork', LTC.saved_network_data_object, LTC.confirm_network_iprange_delete, done);
		});
	});
});

// These next several tests are to set/delete a Network's metadata.
describe('Get the Network\'s current details to check the metadata', function() {
	it('Should return a Network metadata object', function(done) {
		request.post('localhost:3000/api/getNetwork').send(LTC.saved_network_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_network_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				if (LTC.count_network_metadata_items == 0) {
					request.post('localhost:3000/api/metadataNetworkSetAll').send({
						"uuid": LTC.saved_network_uuid,
						"description": 'This is a Network!'
					}).end(function(res) {
						LTH.confirmResultIsObject(res);
						LTC.count_network_metadata_items = 1;
						LTH.showCountMessage(LTC.count_network_metadata_items, 'metadata item');
						done();
					});
				} else {
					LTH.showCountMessage(LTC.count_network_metadata_items, 'metadata item');
					done();
				}
			});
	});
});

describe('Set a Network\'s metadata, deep test', function() {
	it('Should add a key to the Network metadata', function(done) {
		request.post('localhost:3000/api/metadataNetworkSet').send({
			"uuid": LTC.saved_network_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getNetwork', LTC.saved_network_data_object, LTC.confirm_network_metadata_deep_add, done);
		});
	});
});

describe('Delete a Network\'s metadata, deep test', function() {
	it('Should delete the Network metadata', function(done) {
		request.post('localhost:3000/api/metadataNetworkDel').send({
			"uuid": LTC.saved_network_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getNetwork', LTC.saved_network_data_object, LTC.confirm_network_metadata_deep_delete, done);
		});
	});
});

describe('Delete a Network\'s metadata, shallow test', function() {
	it('Should delete the Network metadata', function(done) {
		request.post('localhost:3000/api/metadataNetworkDelAll').send(LTC.saved_network_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getNetwork', LTC.saved_network_data_object, LTC.confirm_network_metadata_shallow_delete, done);
			});
	});
});

describe('Set a Network\'s metadata, shallow test', function() {
	it('Should re-establish the Network metadata', function(done) {
		request.post('localhost:3000/api/metadataNetworkSetAll').send({
			"uuid": LTC.saved_network_uuid,
			"description": 'This is a Network!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getNetwork', LTC.saved_network_data_object, LTC.confirm_network_metadata_shallow_add, done);
		});
	});
});

// And, delete the created items
describe('Delete the test Network', function() {
	it('Should delete a Network', function(done) {
		request.post('localhost:3000/api/deleteNetwork').send(LTC.saved_network_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'Network', LTC.confirm_network_deleted, done);
			});
	});
});

describe('Delete the test IPrange', function() {
	it('Should delete an IPRange', function(done) {
		request.post('localhost:3000/api/deleteIPrange').send(LTC.saved_iprange_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'IP Range', LTC.confirm_iprange_deleted, done);
			});
	});
});