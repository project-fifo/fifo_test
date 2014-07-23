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
	"saved_hypervisor_count": 0,
	"saved_hypervisor_uuid": '',
	"saved_hypervisor_data_object": null,
	"saved_hypervisor_alias": '',
	"new_hypervisor_alias": '',
	"count_hypervisor_metadata_items": 0,
	"count_hypervisor_characteristic_items": 0,
	"saved_hypervisor_metadata": {
		"description": ''
	},
	"saved_hypervisor_characteristics": {}
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

describe('List All Hypervisors', function() {
	it('Should list all the hypervisors', function(done) {
		this.timeout(5000);
		LTH.listAllMembersByAlias('localhost:3000/api/listHypervisors', 'localhost:3000/api/getHypervisor', 'Hypervisor')
			.then(function(theCount) {
				LTC.saved_hypervisor_count = theCount;
				done();
			});
	});
});

describe('Grab the details of the first encountered Hypervisor', function() {
	it('Should get one hypervisor', function(done) {
		request.post('localhost:3000/api/listHypervisors').send({}).end(function(res) {
			var resArray = LTH.confirmResultIsObjectAndParse(res);
			LTC.saved_hypervisor_uuid = resArray[0];
			LTC.saved_hypervisor_data_object = {
				"uuid": LTC.saved_hypervisor_uuid
			};
			request.post('localhost:3000/api/getHypervisor').send({
				"uuid": LTC.saved_hypervisor_uuid
			}).end(function(res2) {
				var resArray2 = LTH.confirmResultIsObjectAndParse(res2);
				LTC.saved_hypervisor_alias = ('alias' in resArray2) ? resArray2.alias : 'Hypervisor Name';
				console.log('Current Hypervisor alias: ' + LTC.saved_hypervisor_alias);
				done();
			});
		});
	});
});

describe('Change the alias for a Hypervisor', function() {
	it('Should change the alias', function(done) {
		LTC.new_hypervisor_alias = LTC.saved_hypervisor_alias + ' 2';
		request.post('localhost:3000/api/aliasHypervisor').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"alias": LTC.new_hypervisor_alias
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_alias_changed, done);
		});
	});
});

describe('Restore the alias for a Hypervisor', function() {
	it('Should change the alias', function(done) {
		request.post('localhost:3000/api/aliasHypervisor').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"alias": LTC.saved_hypervisor_alias
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_alias_restored, done);
		});
	});
});

// These next several tests ensure we can set/delete a Hypervisors's metadata.
describe('Get the Hypervisor\'s current details to check the metadata', function() {
	it('Should return a Hypervisor metadata object', function(done) {
		request.post('localhost:3000/api/getHypervisor').send(LTC.saved_hypervisor_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				if ((eval('typeof(resArray.metadata)') != 'undefined') && (eval('typeof(resArray.metadata.lucera3)') != 'undefined')) {
					LTC.count_hypervisor_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
					LTC.saved_hypervisor_metadata = resArray.metadata.lucera3;
				}
				LTH.showCountMessage(LTC.count_hypervisor_metadata_items, 'metadata item');
				done();
			});
	});
});

describe('Set a Hypervisor\'s metadata, shallow test', function() {
	it('Should setup the Hypervisor metadata', function(done) {
		request.post('localhost:3000/api/metadataHypervisorSetAll').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"description": 'This is a hypervisor description!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_metadata_shallow_add, done);
		});
	});
});

describe('Set a Hypervisor\'s metadata, deep test', function() {
	it('Should add the key to the Hypervisor metadata', function(done) {
		request.post('localhost:3000/api/metadataHypervisorSet').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_metadata_deep_add, done);
		});
	});
});

describe('Delete a Hypervisor\'s metadata, deep test', function() {
	it('Should delete the Hypervisor metadata', function(done) {
		request.post('localhost:3000/api/metadataHypervisorDel').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_metadata_deep_delete, done);
		});
	});
});

describe('Delete a Hypervisor\'s metadata, shallow test', function() {
	it('Should delete the Hypervisor metadata', function(done) {
		request.post('localhost:3000/api/metadataHypervisorDelAll').send(LTC.saved_hypervisor_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_metadata_shallow_delete, done);
			});
	});
});

describe('Re-establish a Hypervisor\'s metadata to the original value', function() {
	it('Should setup the Hypervisor metadata', function(done) {
		request.post('localhost:3000/api/metadataHypervisorSet').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"meta_path": "lucera3",
			"meta_data": LTC.saved_hypervisor_metadata
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

// These next several tests ensure we can set/delete a Hypervisors's characteristics.
describe('Get the Hypervisor\'s current details to check the characteristics', function() {
	it('Should return a Hypervisor object', function(done) {
		request.post('localhost:3000/api/getHypervisor').send(LTC.saved_hypervisor_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				if (eval('typeof(resArray.characteristics)') != 'undefined') {
					LTC.count_hypervisor_characteristic_items = LTH.objectSize(resArray.characteristics);
					LTC.saved_hypervisor_characteristics = resArray.characteristics;
				}
				LTH.showCountMessage(LTC.count_hypervisor_characteristic_items, 'characteristic');
				done();
			});
	});
});

describe('Add a new Hypervisor characteristic', function() {
	it('Should setup one additional Hypervisor characteristic', function(done) {
		request.post('localhost:3000/api/characteristicHypervisorSet').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"characteristic_key": "__testing",
			"characteristic_value": "This is a characteristic!@"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_characteristic_add, done);
		});
	});
});

describe('Delete a Hypervisor\'s characteristic', function() {
	it('Should delete the added Hypervisor characteristic', function(done) {
		request.post('localhost:3000/api/characteristicHypervisorDel').send({
			"uuid": LTC.saved_hypervisor_uuid,
			"characteristic_key": "__testing"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getHypervisor', LTC.saved_hypervisor_data_object, LTC.confirm_hypervisor_characteristic_delete, done);
		});
	});
});