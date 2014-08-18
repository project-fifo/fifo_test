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
	"saved_vm_uuid": '',
	"saved_vm_data_object": null,
	"saved_network_uuid": '',
	"saved_network2_uuid": '',
	"saved_network2_gatewayid": '192.168.1.1',
	"saved_iprange_uuid": '',
	"saved_iprange2_uuid": '',
	"saved_package_uuid": '',
	"saved_dataset_uuid": 'd34c301e-10c3-11e4-9b79-5f67ca448df0',
	"add_delete_dataset": true,
	"snapshot_items_length": 0,
	"saved_snapshot_uuid": '',
	"saved_snapshot_details": {},
	"backup_items_length": 0,
	"saved_backup_uuid": '',
	"saved_backup_details": {},
	"count_vm_metadata_items": 0,
	"count_vm_nic_items": 0,
	"saved_vm_nic_mac_addr": ''
});
// if you created the dataset base64 outside of this test, you may control the delete/creation code
// by (un)/commenting the line below
LTC.add_delete_dataset = false;
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
describe('Delete any previous test VM(s)', function() {
	it('Might delete a VM', function(done) {
		this.timeout(13000);
		LTH.deleteSpecificMemberByAlias('localhost:3000/api/listVMs', 'localhost:3000/api/getVM', 'localhost:3000/api/deleteVM', 'Test VM', 'VM')
			.then(function() {
				Q.delay(6000).then(function() {
					done();
				});
			});
	});
});

describe('Delete any previous test Network(s)', function() {
	it('Might delete a Network', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'localhost:3000/api/deleteNetwork', ['Test Network', 'Test Network 2'], 'Network')
			.then(function() { done(); });
	});
});

describe('Delete any previous test IPrange(s)', function() {
	it('Might delete an IPRange', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'localhost:3000/api/deleteIPrange', ['Test IPrange', 'Test IPrange 2'], 'IPrange')
			.then(function() { done(); });
	});
});

describe('Delete any previous test Package(s)', function() {
	it('Might delete a Package', function(done) {
		LTH.deleteSpecificMember('localhost:3000/api/listPackages', 'localhost:3000/api/getPackage', 'localhost:3000/api/deletePackage', 'Test Package', 'Package')
			.then(function() { done(); });
	});
});

if (LTC.add_delete_dataset) {
	describe('Delete any previous test Dataset(s)', function() {
		it('Might delete a Dataset', function(done) {
			LTH.deleteSpecificMemberByDataset('localhost:3000/api/listDatasets', 'localhost:3000/api/getDataset', 'localhost:3000/api/deleteDataset', LTC.saved_dataset_uuid, 'Dataset')
				.then(function() { done(); });
		});
	});
}

describe('List All VMs', function() {
	it('Should list all the VMs', function(done) {
		this.timeout(8000);
		LTH.listAllMembersByAlias('localhost:3000/api/listVMs', 'localhost:3000/api/getVM', 'VM')
			.then(function(theCount) {
				LTC.saved_vm_count = theCount;
				done();
			});
	});
});

// We must create a Network, Package, and Dataset to successfully create a VM
describe('Add a Network', function() {
	it('Should add a new Network', function(done) {
		request.post('localhost:3000/api/createNetwork').send({
			"networkName": "Test Network",
			"description": "This is a network!"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Add another Network', function() {
	it('Should add another new Network', function(done) {
		request.post('localhost:3000/api/createNetwork').send({
			"networkName": "Test Network 2",
			"description": "This is another network!"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
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
			"tag": "admin"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Add another IPRange', function() {
	it('Should add another new IPrange', function(done) {
		request.post('localhost:3000/api/createIPrange').send({
			"iprangeName": "Test IPrange 2",
			"network": "192.168.1.0",
			"gateway": LTC.saved_network2_gatewayid,
			"netmask": "255.255.255.0",
			"first": "192.168.1.100",
			"last": "192.168.1.200",
			"tag": "admin"
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
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
			done();
		});
	});
});

if (LTC.add_delete_dataset) {
	describe('Add a Dataset', function() {
		this.timeout(220000);
		it('Should add a new Dataset', function(done) {
			console.log('\nGird yourself to wait for ~4 (four) minutes here, depending on the connetion...');
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
}

// Find the ID info for those created items..
describe('Get the test Network', function() {
	it('Should find a Network', function(done) {
		LTH.getSpecificMember('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'Test Network', 'Saving Network uuid: ')
			.then(function(returned_uuid) {
				LTC.saved_network_uuid = returned_uuid;
				done();
			});
	});
});

describe('Get the second test Network', function() {
	it('Should find another Network', function(done) {
		LTH.getSpecificMember('localhost:3000/api/listNetworks', 'localhost:3000/api/getNetwork', 'Test Network 2', 'Saving Network2 uuid: ')
			.then(function(returned_uuid) {
				LTC.saved_network2_uuid = returned_uuid;
				done();
			});
	});
});

describe('Get the test IPrange', function() {
	it('Should find an IPrange', function(done) {
		LTH.getSpecificMember('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'Test IPrange', 'Saving IPrange uuid: ')
			.then(function(returned_uuid) {
				LTC.saved_iprange_uuid = returned_uuid;
				done();
			});
	});
});

describe('Get the second test IPrange', function() {
	it('Should find another IPrange', function(done) {
		LTH.getSpecificMember('localhost:3000/api/listIPranges', 'localhost:3000/api/getIPrange', 'Test IPrange 2', 'Saving IPrange2 uuid: ')
			.then(function(returned_uuid) {
				LTC.saved_iprange2_uuid = returned_uuid;
				done();
			});
	});
});

describe('Get the test Package', function() {
	it('Should find a Package', function(done) {
		LTH.getSpecificMember('localhost:3000/api/listPackages', 'localhost:3000/api/getPackage', 'Test Package', 'Saving package uuid: ')
			.then(function(returned_uuid) {
				LTC.saved_package_uuid = returned_uuid;
				done();
			});
	});
});

// Setup the networks with the IPranges
describe('Add an IPrange to the test Network', function() {
	it('Should add an IPrange to a Network', function(done) {
		request.post('localhost:3000/api/addNetworkIPrange').send({
			"uuid": LTC.saved_network_uuid,
			"iprange_uuid": LTC.saved_iprange_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Add a second IPrange to the second test Network', function() {
	it('Should add a different IPrange to a different Network', function(done) {
		request.post('localhost:3000/api/addNetworkIPrange').send({
			"uuid": LTC.saved_network2_uuid,
			"iprange_uuid": LTC.saved_iprange2_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

// And now, we get to add an actual VM
describe('Add a VM', function() {
	it('Should add a new VM', function(done) {
		this.timeout(80000);
		request.post('localhost:3000/api/createVM').send({
			"dataset_uuid": LTC.saved_dataset_uuid,
			"package_uuid": LTC.saved_package_uuid,
			"config": {
				"alias": "Test VM",
				"hostname": "test.fifo.vm",
				"metadata": {
					"description": "This is a virtual machine!"
				},
				"networks": {
					"net0": LTC.saved_network_uuid
				}
			},
			"description": "This is a VM!"
		}).end(function(res) {
			LTH.confirmResultIsObjectAndParse(res);
			LTH.waitForListItem('localhost:3000/api/listVMs', 'localhost:3000/api/getVM', 'Test VM', 'Saving VM uuid: ', LTC.confirm_vm_created, function() {
				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_running, done, 1000);
			}, 100, 'getSpecificMemberByAlias');
		});
	})
});

// // The next several tests involve testing starting/stopping/rebooting the VM
// describe('Force stop a VM', function() {
// 	it('Should force stop a VM', function(done) {
// 		this.timeout(7000);
// 		request.post('localhost:3000/api/runForceStopVM').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				LTH.confirmResultIsObject(res);
// 				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_stopped, done);
// 			});
// 	});
// });

// // Log in as an admin
// describe('Log in to FiFo as admin', function() {
// 	it('Should return a user object', function(done) {
// 		request.get('localhost:3000/logout').send({}).end(function(res) {
// 			request.post('localhost:3000/api/login').send({
// 				"username": LTH.Config.testing.specAdminUname,
// 				"password": LTH.Config.testing.specAdminPword
// 			}).end(function(res) {
// 				LTH.confirmResultIsObjectAndParse(res, 1);
// 				done();
// 			});
// 		});
// 	});
// });

// describe('Force reboot a VM', function() {
// 	it('Should force reboot a VM', function(done) {
// 		this.timeout(12000);
// 		request.post('localhost:3000/api/runStartVM').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				LTH.confirmResultIsObject(res);
// 				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_running, function() {
// 					request.post('localhost:3000/api/runForceRebootVM').send({
// 						"uuid": LTC.saved_vm_uuid
// 					}).end(function(res2) {
// 						LTH.confirmResultIsObject(res2);
// 						Q.delay(2000).then(function() {
// 							LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_running, done);
// 						})
// 						// LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_shutting_down, function() {
// 						// LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_running, done);
// 						// }, 1);
// 					});
// 				});
// 			});
// 	});
// });

// describe('Stop a VM', function() {
// 	it('Should stop a VM', function(done) {
// 		this.timeout(12000);
// 		request.post('localhost:3000/api/runStopVM').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				LTH.confirmResultIsObject(res);
// 				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_stopped, done, 1000);
// 			});
// 	});
// });

// describe('Start a VM', function() {
// 	it('Should start a VM', function(done) {
// 		this.timeout(10000);
// 		request.post('localhost:3000/api/runStartVM').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				LTH.confirmResultIsObject(res);
// 				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_running, done);
// 			});
// 	});
// });

// describe('Reboot a VM', function() {
// 	it('Should reboot a VM', function(done) {
// 		this.timeout(10000);
// 		request.post('localhost:3000/api/runRebootVM').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				LTH.confirmResultIsObject(res);
// 				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_shutting_down, function() {
// 					LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_running, done);
// 				}, 10);
// 			});
// 	});
// });

// The next several tests involve testing NIC manipulation on the VM
describe('Get the VM\'s current details to check the NIC count', function() {
	it('Should return a VM metadata object', function(done) {
		request.post('localhost:3000/api/getVM').send(LTC.saved_vm_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.count_vm_nic_items = resArray.config.networks.length;
				console.log("Saving NIC item count: " + LTC.count_vm_nic_items);
				done();
			});
	});
});

// describe('Add a NIC to a VM', function() {
// 	it('Should add a new NIC to a VM', function(done) {
// 		this.timeout(14000);
// 		request.post('localhost:3000/api/runForceStopVM').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				LTH.confirmResultIsObject(res);
// 				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_stopped, function() {
// 					request.post('localhost:3000/api/addVMNic').send({
// 						"uuid": LTC.saved_vm_uuid,
// 						"nic_uuid": LTC.saved_network2_uuid
// 					}).end(function(res2) {
// 						LTH.confirmResultIsObject(res2);
// 						LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_network_counts, function() {
// 							LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_nic_gateway_and_save, done);
// 						});
// 					});
// 				});
// 			});
// 	});
// });

// describe('Make a NIC the primary for a VM', function() {
// 	it('Should make a NIC primary for a VM', function(done) {
// 		this.timeout(7000);
// 		request.post('localhost:3000/api/makeVMPrimaryNic').send({
// 			"uuid": LTC.saved_vm_uuid,
// 			"nic_mac": LTC.saved_vm_nic_mac_addr
// 		}).end(function(res) {
// 			LTH.confirmResultIsObject(res);
// 			LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_nic_primary_status, done);
// 		});
// 	});
// });

// describe('Delete a NIC from a VM', function() {
// 	it('Should remove the NIC from the VM', function(done) {
// 		this.timeout(7000);
// 		request.post('localhost:3000/api/deleteVMNic').send({
// 			"uuid": LTC.saved_vm_uuid,
// 			"nic_mac": LTC.saved_vm_nic_mac_addr
// 		}).end(function(res) {
// 			LTH.confirmResultIsObject(res);
// 			LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_nic_count_restored, done);
// 		});
// 	});
// });

// The next several tests involve testing snapshots on the VM
describe('Get the list of snapshots for a VM', function() {
	it('Should return a list of VM snapshots', function(done) {
		request.post('localhost:3000/api/listVMSnapshots').send(LTC.saved_vm_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				LTC.snapshot_items_length = resArray.length;
				expect(LTC.snapshot_items_length).to.be.eql(0);
				done();
			});
	});
});

describe('Create a new snapshot for a VM', function() {
	it('Should create a new snapshot', function(done) {
		this.timeout(7000);
		request.post('localhost:3000/api/createVMSnapshot').send({
			"uuid": LTC.saved_vm_uuid,
			"comment": "New test VM snapshot"
		}).end(function(res) {
			var resArray = LTH.confirmResultIsObjectAndParse(res);
			LTC.saved_snapshot_details = resArray;
			LTH.waitForProperty('localhost:3000/api/listVMSnapshots', LTC.saved_vm_data_object, LTC.confirm_vm_snapshot_created, done);
		});
	});
});

describe('Get the new snapshot details', function() {
	it('Should return a snapshot object', function(done) {
		var this_vm_snapshot_data_object = {
			"uuid": LTC.saved_vm_uuid,
			"snapshot_uuid": LTC.saved_snapshot_uuid
		};
		LTH.waitForProperty('localhost:3000/api/getVMSnapshot', this_vm_snapshot_data_object, LTC.confirm_vm_snapshot_created_deep, done);
	});
});

describe('Rollback a VM to a snapshot', function() {
	it('Should return a VM object', function(done) {
		var this_vm_snapshot_data_object = {
			"uuid": LTC.saved_vm_uuid,
			"snapshot_uuid": LTC.saved_snapshot_uuid
		};
		request.post('localhost:3000/api/rollbackVMSnapshot').send(
			this_vm_snapshot_data_object
		).end(function(res) {
			var resArray = LTH.confirmResultIsObjectAndParse(res);
			expect(resArray[0]).to.be.eql("OK");
			LTH.waitForProperty('localhost:3000/api/getVMSnapshot', this_vm_snapshot_data_object, LTC.confirm_vm_snapshot_rolled_back, done);
		});
	});
});

describe('Delete the new snapshot', function() {
	it('Should delete a snapshot', function(done) {
		this.timeout(7000);
		request.post('localhost:3000/api/deleteVMSnapshot').send({
			"uuid": LTC.saved_vm_uuid,
			"snapshot_uuid": LTC.saved_snapshot_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/listVMSnapshots', LTC.saved_vm_data_object, LTC.confirm_vm_snapshot_deleted, done);
		});
	});
});

// // The next several tests involve testing backups on the VM
// describe('Get the list of backups for a VM', function() {
// 	it('Should return a list of VM backups', function(done) {
// 		request.post('localhost:3000/api/listVMBackups').send(LTC.saved_vm_data_object)
// 			.end(function(res) {
// 				var resArray = LTH.confirmResultIsObjectAndParse(res);
// 				LTC.backup_items_length = resArray.length;
// 				expect(LTC.backup_items_length).to.be.eql(0);
// 				done();
// 			});
// 	});
// });

// describe('Create a new backup for a VM', function() {
// 	it('Should create a new backup', function(done) {
// 		this.timeout(7000);
// 		request.post('localhost:3000/api/createVMBackup').send({
// 			"uuid": LTC.saved_vm_uuid,
// 			"comment": "New test VM backup"
// 		}).end(function(res) {
// 			var resArray = LTH.confirmResultIsObjectAndParse(res);
// 			LTC.saved_backup_details = resArray;
// 			LTH.waitForProperty('localhost:3000/api/listVMBackups', LTC.saved_vm_data_object, LTC.confirm_vm_backup_created, done);
// 		});
// 	});
// });

// describe('Get the new backup details', function() {
// 	it('Should return a backup object', function(done) {
// 		var this_vm_backup_data_object = {
// 			"uuid": LTC.saved_vm_uuid,
// 			"backup_uuid": LTC.saved_backup_uuid
// 		};
// 		LTH.waitForProperty('localhost:3000/api/getVMBackup', this_vm_backup_data_object, LTC.confirm_vm_backup_created_deep, done);
// 	});
// });

// describe('Rollback a VM to a backup', function() {
// 	it('Should return a VM object', function(done) {
// 		request.post('localhost:3000/api/rollbackVMBackup').send({
// 			"uuid": LTC.saved_vm_uuid,
// 			"backup_uuid": LTC.saved_backup_uuid
// 		}).end(function(res) {
// 			LTH.confirmResultIsObject(res);
// 			expect(res.text).to.be.eql("OK");
// 			done();
// 		});
// 	});
// });

// describe('Delete the new backup', function() {
// 	it('Should delete a backup', function(done) {
// 		this.timeout(7000);
// 		request.post('localhost:3000/api/deleteVMBackup').send({
// 			"uuid": LTC.saved_vm_uuid,
// 			"backup_uuid": LTC.saved_backup_uuid
// 		}).end(function(res) {
// 			LTH.confirmResultIsObject(res);
// 			LTH.waitForProperty('localhost:3000/api/listVMBackups', LTC.saved_vm_data_object, LTC.confirm_vm_backup_deleted, done);
// 		});
// 	});
// });

// These next several tests are just to ensure we can set/delete a VM's metadata separately from its creation.
describe('Get the VM\'s current details to check the metadata', function() {
	it('Should return a VM metadata object', function(done) {
		request.post('localhost:3000/api/getVM').send(LTC.saved_vm_data_object)
			.end(function(res) {
				var resArray = LTH.confirmResultIsObjectAndParse(res);
				count_vm_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				if (count_vm_metadata_items == 0) {
					request.post('localhost:3000/api/metadataVMSetAll').send({
						"uuid": LTC.saved_vm_uuid,
						"description": 'This is a VM!'
					}).end(function(res2) {
						LTH.confirmResultIsObject(res2);
						count_vm_metadata_items = 1;
						LTH.showCountMessage(count_vm_metadata_items, 'metadata item');
						done();
					});
				} else {
					LTH.showCountMessage(count_vm_metadata_items, 'metadata item');
					done();
				}
			});
	});
});

describe('Set a VM\'s metadata, deep test', function() {
	it('Should add a key to the VM metadata', function(done) {
		request.post('localhost:3000/api/metadataVMSet').send({
			"uuid": LTC.saved_vm_uuid,
			"meta_path": ["lucera3", "extra_data"],
			"meta_data": {
				"one": '2New Description'
			}
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_metadata_deep_add, done);
		});
	});
});

describe('Delete a VM\'s metadata, deep test', function() {
	it('Should delete the VM metadata', function(done) {
		this.timeout(4000);
		request.post('localhost:3000/api/metadataVMDel').send({
			"uuid": LTC.saved_vm_uuid,
			"meta_path": ["lucera3", "extra_data"]
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_metadata_deep_delete, done);
		});
	});
});

describe('Delete a VM\'s metadata, shallow test', function() {
	it('Should delete the VM metadata', function(done) {
		request.post('localhost:3000/api/metadataVMDelAll').send(LTC.saved_vm_data_object)
			.end(function(res) {
				LTH.confirmResultIsObject(res);
				LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_metadata_shallow_delete, done);
			});
	});
});

describe('Set a VM\'s metadata, shallow test', function() {
	it('Should re-establish the VM metadata', function(done) {
		request.post('localhost:3000/api/metadataVMSetAll').send({
			"uuid": LTC.saved_vm_uuid,
			"description": 'This is a VM!'
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_metadata_shallow_add, done);
		});
	});
});

// Here's the cleanup for the temporarily-created items
describe('Delete the test VM', function() {
	it('Should delete a VM', function(done) {
		this.timeout(13000);
		// request.post('localhost:3000/api/runForceStopVM').send(LTC.saved_vm_data_object)
		// 	.end(function(res) {
		// 		LTH.confirmResultIsObject(res);
		// 		LTH.waitForProperty('localhost:3000/api/getVM', LTC.saved_vm_data_object, LTC.confirm_vm_stopped, function() {
					LTH.deleteSpecificMemberByAlias('localhost:3000/api/listVMs', 'localhost:3000/api/getVM', 'localhost:3000/api/deleteVM', 'Test VM', 'VM')
						.then(function() {
							Q.delay(6000).then(function() {
								done();
							});
						});
		// 		});
		// 	});
	});
});

describe('Delete the test Network', function() {
	it('Should delete a Network', function(done) {
		request.post('localhost:3000/api/deleteNetwork').send({
			"uuid": LTC.saved_network_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Delete the second test Network', function() {
	it('Should delete another Network', function(done) {
		request.post('localhost:3000/api/deleteNetwork').send({
			"uuid": LTC.saved_network2_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Delete the test IPrange', function() {
	it('Should delete an IPRange', function(done) {
		request.post('localhost:3000/api/deleteIPrange').send({
			"uuid": LTC.saved_iprange_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Delete the second test IPrange', function() {
	it('Should delete another IPRange', function(done) {
		request.post('localhost:3000/api/deleteIPrange').send({
			"uuid": LTC.saved_iprange2_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

describe('Delete the test Package', function() {
	it('Should delete a Package', function(done) {
		request.post('localhost:3000/api/deletePackage').send({
			"uuid": LTC.saved_package_uuid
		}).end(function(res) {
			LTH.confirmResultIsObject(res);
			done();
		});
	});
});

if (LTC.add_delete_dataset) {
	describe('Delete the test Dataset', function() {
		it('Should delete a Dataset', function(done) {
			request.post('localhost:3000/api/deleteDataset').send({
				"uuid": LTC.saved_dataset_uuid
			}).end(function(res) {
				LTH.confirmResultIsObject(res);
				done();
			});
		});
	});
}
