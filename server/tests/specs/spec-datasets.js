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
	"saved_dataset_count": 0,
	"saved_dataset_uuid": '75559714-6bd0-11e2-aa72-fb522708e25d',
	"saved_dataset_data_object": {
		"uuid": '75559714-6bd0-11e2-aa72-fb522708e25d'
	},
	"count_dataset_metadata_items": 0
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
describe('Delete any previous test Dataset(s)', function() {
	it('Might delete a Dataset', function(done) {
		LTH.deleteSpecificMemberByDataset('localhost:3000/api/listDatasets', 'localhost:3000/api/getDataset', 'localhost:3000/api/deleteDataset', LTC.saved_dataset_uuid, 'Dataset')
			.then(done);
	});
});

describe('List All Datasets', function() {
	it('Should list all the Datasets', function(done) {
		LTH.listAllMembersByDataset('localhost:3000/api/listDatasets', 'localhost:3000/api/getDataset', 'Dataset')
			.then(function(theCount) {
				LTC.saved_dataset_count = theCount;
				done();
			});
	});
});

describe('Add a Dataset', function() {
	this.timeout(60000);
	it('Should add a new Dataset', function(done) {
		request.post('localhost:3000/api/createDataset').send({
			"datasetUrl": "http://datasets.at/datasets/" + LTC.saved_dataset_uuid,
			"datasetName": "Test Dataset!",
			"description": "This is a dataset!"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForListCount('localhost:3000/api/listDatasets', 'localhost:3000/api/getDataset', 'Dataset', LTC.confirm_dataset_created, function() {
				LTH.waitForProperty('localhost:3000/api/getDataset', LTC.saved_dataset_data_object, LTC.confirm_dataset_downloaded, done);
			}, 100, 'listAllMembersByDataset');
		});
	});
});

// These next several tests are to set/delete a Dataset's metadata.
describe('Get the Dataset\'s current details to check the metadata', function() {
	it('Should return a Dataset metadata object', function(done) {
		request.post('localhost:3000/api/getDataset').send(LTC.saved_dataset_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_dataset_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				LTH.showCountMessage(LTC.count_dataset_metadata_items, 'metadata item');
				done();
			});
	});
});

describe('Set a Dataset\'s metadata, deep test', function() {
	it('Should add to the Dataset metadata', function(done) {
		request.post('localhost:3000/api/metadataDatasetSet').send({
			"uuid": LTC.saved_dataset_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getDataset', LTC.saved_dataset_data_object, LTC.confirm_dataset_metadata_deep_add, done);
		});
	});
});

describe('Delete a Dataset\'s metadata, deep test', function() {
	it('Should delete the Dataset metadata', function(done) {
		request.post('localhost:3000/api/metadataDatasetDel').send({
			"uuid": LTC.saved_dataset_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getDataset', LTC.saved_dataset_data_object, LTC.confirm_dataset_metadata_deep_delete, done);
		});
	});
});

describe('Delete a Dataset\'s metadata, shallow test', function() {
	it('Should delete the Dataset metadata', function(done) {
		request.post('localhost:3000/api/metadataDatasetDelAll').send(LTC.saved_dataset_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getDataset', LTC.saved_dataset_data_object, LTC.confirm_dataset_metadata_shallow_delete, done);
			});
	});
});

describe('Set a Dataset\'s metadata, shallow test', function() {
	it('Should re-establish the Dataset metadata', function(done) {
		request.post('localhost:3000/api/metadataDatasetSetAll').send({
			"uuid": LTC.saved_dataset_uuid,
			"datasetName": 'Test Dataset!',
			"description": 'This is a Dataset!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getDataset', LTC.saved_dataset_data_object, LTC.confirm_dataset_metadata_shallow_add, done);
		});
	});
});

// And now we're done, time to cleanup
describe('Delete the test Dataset', function() {
	it('Should delete a Dataset', function(done) {
		request.post('localhost:3000/api/deleteDataset').send(LTC.saved_dataset_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForListCount('localhost:3000/api/listDatasets', 'localhost:3000/api/getDataset', 'Dataset', LTC.confirm_dataset_deleted, done, 100, 'listAllMembersByDataset');
			});
	});
});