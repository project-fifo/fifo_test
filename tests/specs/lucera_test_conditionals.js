// DEPENDENCIES
// ============

// var request = require('superagent'),
// 	expect = require('expect.js'),
// 	Q = require('../../../node_modules/q/q.js'),
// 	util = require('util');

// LTC DEFINITION
// =============

module.exports.ltc = function (LTH) {

	var my = {

		// this function lets us setup semi-global vars for these functions to pass around

		setup: function (varsToCreate)
		{
			for(key in varsToCreate)
			{
				my[key] = varsToCreate[key];
			}
		},

		// support functions for spec-datasets.js

		confirm_dataset_created: function (theCount)
		{
			return (theCount == (my.saved_dataset_count + 1));
		},

		confirm_dataset_downloaded: function (resArray)
		{
			return (resArray["imported"] === 1);
		},

		confirm_dataset_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 3);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_dataset_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 2);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_dataset_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_dataset_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is a Dataset!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_dataset_deleted: function (theCount)
		{
			return (theCount == my.saved_dataset_count);
		},

		// support functions for spec-dtraces.js

		confirm_dtrace_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_dtrace_uuid = theUuid;
				my.saved_dtrace_data_object = { "uuid": my.saved_dtrace_uuid };
			}
			return condition;
		},

		confirm_dtrace_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_dtrace_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 1);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_dtrace_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_dtrace_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is a Dtrace!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_dtrace_deleted: function (theCount)
		{
			return (theCount == my.saved_dtrace_count);
		},

		// support functions for spec-groups.js

		confirm_group_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_user_group_uuid = theUuid;
				my.saved_group_data_object = { "uuid": my.saved_user_group_uuid };
			}
			return condition;
		},

		confirm_group_permissions_added: function (resArray)
		{
			var temp_count = resArray.length;
			var condition = (temp_count > my.saved_group_perm_count);
			if (condition)
				LTH.showCountMessage(temp_count, 'permission');
			return condition;
		},

		confirm_group_permissions_restored: function (resArray)
		{
			var temp_count = resArray.length;
			var condition = (temp_count == my.saved_group_perm_count);
			if (condition)
				LTH.showCountMessage(temp_count, 'permission');
			return condition;
		},

		confirm_group_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
				condition2 = (temp_count_metadata_items == my.count_group_metadata_items+1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_group_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == my.count_group_metadata_items);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_group_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_group_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_group_deleted: function (theCount)
		{
			return (theCount == my.saved_group_count);
		},

		// support functions for spec-hypervisors.js

		confirm_hypervisor_alias_changed: function (resArray)
		{
			var the_curr_alias = resArray.alias;
			var condition = (the_curr_alias == my.new_hypervisor_alias);
			if (condition)
				console.log('Current Hypervisor alias: ' + the_curr_alias);
			return condition;
		},

		confirm_hypervisor_alias_restored: function (resArray)
		{
			var the_curr_alias = resArray.alias;
			var condition = (the_curr_alias == my.saved_hypervisor_alias);
			if (condition)
				console.log('Current Hypervisor alias: ' + the_curr_alias);
			return condition;

		},

		confirm_hypervisor_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_hypervisor_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 1);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_hypervisor_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_hypervisor_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is a hypervisor description!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_hypervisor_characteristic_add: function (resArray)
		{
			var condition1 = ('characteristics' in resArray)
				&& ('__testing' in resArray.characteristics)
				&& (resArray.characteristics.__testing == 'This is a characteristic!@');
			var condition2 = false;
			if (condition1) {
				var temp_count_characteristic_items = LTH.objectSize(resArray.characteristics);
				condition2 = (temp_count_characteristic_items == (my.count_hypervisor_characteristic_items + 1));
				if (condition2)
					LTH.showCountMessage(temp_count_characteristic_items, 'characteristic');
			}
			return (condition1 && condition2);
		},

		confirm_hypervisor_characteristic_delete: function (resArray)
		{
			var temp_count_characteristic_items = LTH.objectSize(resArray.characteristics);
			var condition = (temp_count_characteristic_items == my.count_hypervisor_characteristic_items);
			if (condition)
				LTH.showCountMessage(temp_count_characteristic_items, 'characteristic');
			return condition;
		},

		// support functions for spec-ipranges.js

		confirm_iprange_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_iprange_uuid = theUuid;
				my.saved_iprange_data_object = { "uuid": my.saved_iprange_uuid };
			}
			return condition;
		},

		confirm_iprange_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_iprange_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 1);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_iprange_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_iprange_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is an IPRange!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_iprange_deleted: function (theCount)
		{
			return (theCount == my.saved_iprange_count);
		},

		// support functions for spec-networks.js

		confirm_network_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_network_uuid = theUuid;
				my.saved_network_data_object = { "uuid": my.saved_network_uuid };
			}
			return condition;
		},

		confirm_network_iprange_added: function (resArray)
		{
			var temp_count_network_ipranges = 0;
			if ('ipranges' in resArray)
				temp_count_network_ipranges = resArray.ipranges.length;
			var condition = (temp_count_network_ipranges === 1);
			if (condition)
				LTH.showCountMessage(temp_count_network_ipranges, 'IPrange');
			return condition;
		},

		confirm_network_iprange_delete: function (resArray)
		{
			var temp_count_network_ipranges = resArray.ipranges.length;
			var condition = (temp_count_network_ipranges === 0);
			if (condition)
				LTH.showCountMessage(temp_count_network_ipranges, 'IPrange');
			return condition;
		},

		confirm_network_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_network_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 1);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_network_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_network_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is a Network!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_network_deleted: function (theCount)
		{
			return (theCount == my.saved_network_count);
		},

		// support functions for spec-orgs.js

		confirm_org_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_user_org_uuid = theUuid;
				my.saved_org_data_object = { "uuid": my.saved_user_org_uuid };
			}
			return condition;
		},

		confirm_org_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 6);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_org_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 5);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_org_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_org_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('company' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.company == '2Company 2');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 4);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_org_trigger_created: function(resArray) {
			var temp_count_trigger_items = LTH.objectSize(resArray);
			var condition = (temp_count_trigger_items === (my.count_org_trigger_items + 1));
			if (condition)
				LTH.showCountMessage(temp_count_trigger_items, 'trigger');
			return condition;
		},

		confirm_org_trigger_deleted: function(resArray) {
			var temp_count_trigger_items = LTH.objectSize(resArray);
			var condition = (temp_count_trigger_items === my.count_org_trigger_items);
			if (condition)
				LTH.showCountMessage(temp_count_trigger_items, 'trigger');
			return condition;
		},

		confirm_organization_deleted: function (theCount)
		{
			return (theCount == my.saved_org_count);
		},

		// support functions for spec-packages.js

		confirm_package_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_package_uuid = theUuid;
				my.saved_package_data_object = { "uuid": my.saved_package_uuid };
			}
			return condition;
		},

		confirm_package_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_package_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 1);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_package_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_package_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is a Package!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_package_deleted: function (theCount)
		{
			return (theCount == my.saved_package_count);
		},

		// support functions for spec-users.js

		confirm_user_created: function (theCount)
		{
			return (theCount == (my.saved_user_count + 1));
		},

		confirm_user_login_failure: function (res)
		{
			var condition = (res instanceof Object)
				&& ('text' in res)
				&& (res.text === 'Invalid login.');
			return condition;
		},

		confirm_user_permissions_added: function (resArray)
		{
			var temp_count = resArray.length;
			var condition = (temp_count > my.saved_user_perm_count);
			if (condition)
				LTH.showCountMessage(temp_count, 'permission');
			return condition;
		},

		confirm_user_permissions_restored: function (resArray)
		{
			var temp_count = resArray.length;
			var condition = (temp_count == my.saved_user_perm_count);
			if (condition)
				LTH.showCountMessage(temp_count, 'permission');
			return condition;
		},

		confirm_user_group_added: function(resArray)
		{
			var temp_group_count = resArray.length;
			var condition = (temp_group_count === (my.saved_user_group_count + 1));
			if (condition)
				LTH.showCountMessage(temp_group_count, 'user group');
			return condition;
		},

		confirm_user_group_deleted: function(resArray)
		{
			var temp_group_count = resArray.length;
			var condition = (temp_group_count === my.saved_user_group_count);
			if (condition)
				LTH.showCountMessage(temp_group_count, 'user group');
			return condition;
		},

		confirm_user_org_added: function(resArray)
		{
			var temp_org_count = resArray.length;
			var condition = (temp_org_count === (my.saved_user_org_count + 1));
			if (condition)
				LTH.showCountMessage(temp_org_count, 'user organization');
			return condition;
		},

		confirm_user_org_deleted: function(resArray)
		{
			var temp_org_count = resArray.length;
			var condition = (temp_org_count === my.saved_user_org_count);
			if (condition)
				LTH.showCountMessage(temp_org_count, 'user organization');
			return condition;
		},

		confirm_user_org_active: function(resArray)
		{
			var temp_org_count = resArray.length;
			var condition = (temp_org_count === (my.saved_user_org_count + 1));
			if (condition)
				LTH.showCountMessage(temp_org_count, 'user organization');
			return condition;
		},

		confirm_user_key_added: function(resArray)
		{
			var temp_key_count = LTH.objectSize(resArray);
			var condition = (temp_key_count === (my.saved_user_key_count + 1));
			if (condition)
				LTH.showCountMessage(temp_key_count, 'user key');
			return condition;
		},

		confirm_user_key_deleted: function(resArray)
		{
			var temp_key_count = LTH.objectSize(resArray);
			var condition = (temp_key_count === my.saved_user_key_count);
			if (condition)
				LTH.showCountMessage(temp_key_count, 'user key');
			return condition;
		},

		confirm_user_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('name' in resArray.metadata.lucera3)
				&& ('first' in resArray.metadata.lucera3.name)
				&& (resArray.metadata.lucera3.name.first == 'Tester');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 3);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_user_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items === 3);
			var temp_count_user_deep_metadata_items = LTH.objectSize(resArray.metadata.lucera3.name);
			var condition3 = (temp_count_user_deep_metadata_items === 1);
			if (condition2)
			{
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
				LTH.showCountMessage(temp_count_user_deep_metadata_items, 'deep metadata item');
			}
			return (condition1 && condition2 && condition3);
		},

		confirm_user_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_user_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('name' in resArray.metadata.lucera3)
				&& ('first' in resArray.metadata.lucera3.name)
				&& (resArray.metadata.lucera3.name.first == '2Tester');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 3);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_user_deleted: function (theCount)
		{
			return (theCount == my.saved_user_count);
		},

		// support functions for spec-vms.js

		confirm_vm_created: function (theUuid)
		{
			var condition = (theUuid.length > 5);
			if (condition) {
				my.saved_vm_uuid = theUuid;
				my.saved_vm_data_object = { "uuid": my.saved_vm_uuid };
			}
			return condition;
		},

		confirm_vm_running: function (resArray)
		{
			var condition = ('state' in resArray)
			 	&& (resArray['state'] === "running");
			return condition;
		},

		confirm_vm_stopped: function (resArray)
		{
			var condition = ('state' in resArray)
			 	&& (resArray['state'] === "stopped");
			return condition;
		},

		confirm_vm_stopped_or_running: function (resArray)
		{
			var condition = (my.confirm_vm_running(resArray) || my.confirm_vm_stopped(resArray));
			return condition;
		},

		confirm_vm_shutting_down: function (resArray)
		{
			var condition = ('state' in resArray)
			 	&& (resArray['state'] === "shutting_down");
			return condition;
		},

		confirm_vm_network_counts: function (resArray)
		{
			var temp_count_vm_nic_items = resArray.config.networks.length;
			var condition = (temp_count_vm_nic_items == (my.count_vm_nic_items + 1));
			return condition;
		},

		confirm_vm_nic_gateway_and_save: function (resArray)
		{
			for(var i = 0; i < resArray.config.networks.length; i++) {
				if (resArray.config.networks[i].gateway === my.saved_network2_gatewayid) {
					my.saved_vm_nic_mac_addr = resArray.config.networks[i].mac;
					console.log('Saving NIC MAC address: ' + my.saved_vm_nic_mac_addr);
				}
			}
			var condition = (my.saved_vm_nic_mac_addr !== '');
			return condition;
		},

		confirm_vm_nic_primary_status: function (resArray)
		{
			var condition = false;
			for(var i = 0; i < resArray.config.networks.length; i++) {
				if (resArray.config.networks[i].gateway === my.saved_network2_gatewayid) {
					if ('primary' in resArray.config.networks[i]) {
						condition = resArray.config.networks[i].primary;
					}
				}
			}
			return condition;
		},

		confirm_vm_snapshot_created: function (resArray)
		{
			var temp_snapshot_items_length = resArray.length;
			if (temp_snapshot_items_length == (my.snapshot_items_length + 1))
				my.saved_snapshot_uuid = resArray[0].uuid;
			var condition = (my.saved_snapshot_uuid.length > 5);
			return condition;
		},

		confirm_vm_snapshot_created_deep: function (resArray)
		{
			var condition = (JSON.stringify(my.saved_snapshot_details) === JSON.stringify(resArray));
			return condition;
		},

		confirm_vm_snapshot_deleted: function (resArray)
		{
			var temp_snapshot_items_length = resArray.length;
			var condition = (temp_snapshot_items_length == my.snapshot_items_length);
			return condition;
		},

		confirm_vm_nic_count_restored: function (resArray)
		{
			var temp_count_vm_nic_items = resArray.config.networks.length;
			return (temp_count_vm_nic_items == my.count_vm_nic_items);
		},

		confirm_vm_metadata_deep_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('extra_data' in resArray.metadata.lucera3)
				&& ('one' in resArray.metadata.lucera3.extra_data)
				&& (resArray.metadata.lucera3.extra_data.one == '2New Description');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 2);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_vm_metadata_deep_delete: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& !('extra_data' in resArray.metadata.lucera3);
			var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
			var condition2 = (temp_count_metadata_items == 1);
			if (condition2)
				LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			return (condition1 && condition2);
		},

		confirm_vm_metadata_shallow_delete: function (resArray)
		{
			var condition = (!resArray.metadata.lucera3);
			if (condition)
				LTH.showCountMessage(0, 'metadata item');
			return condition;
		},

		confirm_vm_metadata_shallow_add: function (resArray)
		{
			var condition1 = ('metadata' in resArray)
				&& ('lucera3' in resArray.metadata)
				&& ('description' in resArray.metadata.lucera3)
				&& (resArray.metadata.lucera3.description == 'This is a VM!');
			var condition2 = false;
			if (condition1) {
				var temp_count_metadata_items = LTH.objectSize(resArray.metadata.lucera3);
				condition2 = (temp_count_metadata_items == 1);
				if (condition2)
					LTH.showCountMessage(temp_count_metadata_items, 'metadata item');
			}
			return (condition1 && condition2);
		},

		confirm_vm_deleted: function (theCount)
		{
			return (theCount == my.saved_vm_count);
		}


	}
	return my;
};
