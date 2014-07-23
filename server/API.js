// ## API ##
// =========

// Export the API so it is accessable from [server.js](${basepath}/server/server.js)
// Be sure to pass in the server variable in addition to any other required custom objects

module.exports.api = function(server, ApiVariables) {

  var mi = 0,
    fifo = ApiVariables[mi++],

    ensureUserIsLoggedIn = function(req, res, next) {
      if (!req.session.user) {
        res.writeHead(301, {
          Location: '/'
        });
        res.end();
      } else {
        next();
      }
    };

  // Home Route (GET)
  // ----------------
  //
  // If the user is logged in, show the app, otherwise the login.

  server.get('/', function(req, res) {
    if (req.session.user) {
      res.render('app.ejs');
    } else {
      var normalLoginFn = function() {
        res.render('login.ejs');
      };
      // console.log(req.query);
      if ('code' in req.query) {
        fifo.checkAutoLogin(req, res, normalLoginFn);
      } else {
        normalLoginFn();
      }
    }
  });

  // newVM/create (POST)
  // -------------------
  //
  // Actually create a new virtual machine.
  //
  // Required payload:
  // - an object of objects with these names indicated on -- lines below
  // - each object can specify a uuid, or the properties required for each other API call
  // -- network
  // -- iprange
  // -- package
  // -- dataset
  // -- vm

  server.post('/api/newVM/create',
    ensureUserIsLoggedIn,
    fifo.createVMbyObj
  );

  // login (POST)
  // ------------
  //
  // Login as a specific User.
  //
  // Required payload:
  // - username
  // - password

  server.post('/api/login',
    fifo.login
  );

  // getUser (GET)
  // -------------
  //
  // Get the information for the current User.
  //
  // No Required payload.

  server.get('/api/getUser',
    ensureUserIsLoggedIn,
    fifo.getCurrentUser
  );

  // getUser (POST)
  // --------------
  //
  // Get the information for a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/getUser',
    ensureUserIsLoggedIn,
    fifo.getUser
  );

  // sessionTest (POST)
  // ------------------
  //
  // Check that a session is active.
  //
  // No Required payload.

  server.post('/api/sessions',
    ensureUserIsLoggedIn,
    fifo.sessionTest
  );

  // COMPILED DATA VIEWS
  // ===================

  // listCloudDatacenterCount (POST)
  // -------------------------------
  //
  // Quickly list the number of datacenters before any other data loads.
  //
  // No Required payload.

  server.post('/api/listCloudDatacenterCount',
    ensureUserIsLoggedIn,
    fifo.listCloudDatacenterCount
  );

  // listCloudOverviewData (POST)
  // ----------------------------
  //
  // List all the data necessary for Cloud Detail view.
  //
  // No Required payload.

  server.post('/api/listCloudOverviewData',
    ensureUserIsLoggedIn,
    fifo.listCloudOverviewData
  );

  // listCloudDetailData (POST)
  // --------------------------
  //
  // List all the data necessary for Cloud Detail view.
  //
  // No Required payload.

  server.post('/api/listCloudDetailData',
    ensureUserIsLoggedIn,
    fifo.listCloudDetailData
  );

  // listMachineData (POST)
  // ----------------------
  //
  // List all the data necessary for Cloud Detail view.
  //
  // No Required payload.

  server.post('/api/listMachineData',
    ensureUserIsLoggedIn,
    fifo.listMachineData
  );

  // listUserViewsData (POST)
  // ------------------------
  //
  // List all the data necessary for Cloud Detail view.
  //
  // No Required payload.

  server.post('/api/listUserViewsData',
    ensureUserIsLoggedIn,
    fifo.listUserViewsData
  );

  // listOrgViewData (POST)
  // ----------------------
  //
  // List all the data necessary for Org Detail view (with VMs for possible billing).
  //
  // No Required payload.

  server.post('/api/listOrgViewData',
    ensureUserIsLoggedIn,
    fifo.listOrgViewData
  );

  // USERS
  // =====

  // listUsers (POST)
  // ----------------
  //
  // List all the Users in the database.
  //
  // No Required payload.

  server.post('/api/listUsers',
    ensureUserIsLoggedIn,
    fifo.listUsers
  );

  // createUser (POST)
  // -----------------
  //
  // Create a new User.
  //
  // Required payload:
  // - username
  // - password
  // - orgName
  //
  // Meta Payload
  // - first_name
  // - last_name
  // - email
  // - title

  server.post('/api/createUser',
    ensureUserIsLoggedIn,
    fifo.createUser
  );

  // changePassword (POST)
  // ---------------------
  //
  // Change the password for a User.
  //
  // Required payload:
  // - uuid
  // - new_password

  server.post('/api/changePassword',
    ensureUserIsLoggedIn,
    fifo.changePassword
  );

  // deleteUser (POST)
  // -----------------
  //
  // Delete a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteUser',
    ensureUserIsLoggedIn,
    fifo.deleteUser
  );

  // listUserPermissions (POST)
  // --------------------------
  //
  // List the Permissions for a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/listUserPermissions',
    ensureUserIsLoggedIn,
    fifo.listUserPerms
  );

  // grantUserPermissions (POST)
  // ---------------------------
  //
  // Grant a specific Permissions to a specific User.
  //
  // Required payload:
  // - uuid
  // - permission

  server.post('/api/grantUserPermission',
    ensureUserIsLoggedIn,
    fifo.grantUserPerm
  );

  // revokeUserPermissions (POST)
  // ----------------------------
  //
  // Revoke a specific Permissions for a specific User.
  //
  // Required payload:
  // - uuid
  // - permission

  server.post('/api/revokeUserPermission',
    ensureUserIsLoggedIn,
    fifo.revokeUserPerm
  );

  // listUserRoles (POST)
  // --------------------
  //
  // List the Roles for a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/listUserRoles',
    ensureUserIsLoggedIn,
    fifo.listUserRoles
  );

  // addUserRole (POST)
  // ------------------
  //
  // Add a User to the specified Role.
  //
  // Required payload:
  // - uuid
  // - role_uuid
  // - role_name

  server.post('/api/addUserRole',
    ensureUserIsLoggedIn,
    fifo.addUserRole
  );

  // delUserRole (POST)
  // ------------------
  //
  // Delete a User from the specified Role.
  //
  // Required payload:
  // - uuid
  // - role_uuid

  server.post('/api/delUserRole',
    ensureUserIsLoggedIn,
    fifo.delUserRole
  );

  // listUserKeys (POST)
  // -------------------
  //
  // List the Keys for a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/listUserKeys',
    ensureUserIsLoggedIn,
    fifo.listUserKeys
  );

  // addUserKey (POST)
  // -----------------
  //
  // Add a Key for a User.
  //
  // Required payload:
  // - uuid
  // - key_id
  // - key_data

  server.post('/api/addUserKey',
    ensureUserIsLoggedIn,
    fifo.addUserKey
  );

  // delUserKey (POST)
  // -----------------
  //
  // Delete a Key for a User.
  //
  // Required payload:
  // - uuid
  // - key_id

  server.post('/api/delUserKey',
    ensureUserIsLoggedIn,
    fifo.delUserKey
  );

  // listYubiKeys (POST)
  // -------------------
  //
  // List the YubiKeys for a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/listYubiKeys',
    ensureUserIsLoggedIn,
    fifo.listYubiKeys
  );

  // addYubiKey (POST)
  // -----------------
  //
  // Add a YubiKey for a User.
  //
  // Required payload:
  // - uuid
  // - key_data

  server.post('/api/addYubiKey',
    ensureUserIsLoggedIn,
    fifo.addYubiKey
  );

  // delYubiKey (POST)
  // -----------------
  //
  // Delete a YubiKey for a User.
  //
  // Required payload:
  // - uuid
  // - key_id

  server.post('/api/delYubiKey',
    ensureUserIsLoggedIn,
    fifo.delYubiKey
  );

  // listUserOrgs (POST)
  // -------------------
  //
  // List the Organizations for a specific User.
  //
  // Required payload:
  // - uuid

  server.post('/api/listUserOrgs',
    ensureUserIsLoggedIn,
    fifo.listUserOrgs
  );

  // addUserOrganization (POST)
  // --------------------------
  //
  // Add a User to the specified Organization.
  //
  // Required payload:
  // - uuid
  // - org_uuid

  server.post('/api/addUserOrg',
    ensureUserIsLoggedIn,
    fifo.addUserOrg
  );

  // activateUserOrganization (POST)
  // -------------------------------
  //
  // Add a User to the specified Organization, and make it their active Organization.
  //
  // Required payload:
  // - uuid
  // - org_uuid

  server.post('/api/activateUserOrg',
    ensureUserIsLoggedIn,
    fifo.activateUserOrg
  );

  // delUserOrganization (POST)
  // --------------------------
  //
  // Delete a User from the specified Organization.
  //
  // Required payload:
  // - uuid
  // - org_uuid

  server.post('/api/delUserOrg',
    ensureUserIsLoggedIn,
    fifo.delUserOrg
  );

  // metadataUserSetAll (POST)
  // -------------------------
  //
  // Sets the entire metadata object for a specific User.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - first_name
  // - last_name
  // - email
  // - title

  server.post('/api/metadataUserSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataUserSetAll
  );

  // metadataUserDelAll (POST)
  // -------------------------
  //
  // Deletes a User's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataUserDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataUserDelAll
  );

  // metadataUserSubSet (POST)
  // -------------------------
  //
  // Sets the metadata - for a deep key - for a specific User.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataUserSet',
    ensureUserIsLoggedIn,
    fifo.metadataUserSet
  );

  // metadataUserSubDel (POST)
  // -------------------------
  //
  // Deletes a User's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataUserDel',
    ensureUserIsLoggedIn,
    fifo.metadataUserDel
  );

  // ROLES
  // =====

  // listRoles (POST)
  // ----------------
  //
  // List all the Roles in the database.
  //
  // No Required payload.

  server.post('/api/listRoles',
    ensureUserIsLoggedIn,
    fifo.listRoles
  );

  // createRole (POST)
  // -----------------
  //
  // Create a new Role.
  //
  // Required payload:
  // - roleName
  //
  // Meta Payload
  // - description

  server.post('/api/createRole',
    ensureUserIsLoggedIn,
    fifo.createRole
  );

  // getRole (POST)
  // --------------
  //
  // Get a specific Role.
  //
  // Required payload:
  // - uuid

  server.post('/api/getRole',
    ensureUserIsLoggedIn,
    fifo.getRole
  );

  // deleteRole (POST)
  // -----------------
  //
  // Delete a specific Role.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteRole',
    ensureUserIsLoggedIn,
    fifo.deleteRole
  );

  // listRolePermissions (POST)
  // --------------------------
  //
  // List the Permissions for a specific Role.
  //
  // Required payload:
  // - uuid

  server.post('/api/listRolePermissions',
    ensureUserIsLoggedIn,
    fifo.listRolePerms
  );

  // grantRolePermissions (POST)
  // ---------------------------
  //
  // Grant a specific Permissions to a specific Role.
  //
  // Required payload:
  // - uuid
  // - permission

  server.post('/api/grantRolePermission',
    ensureUserIsLoggedIn,
    fifo.grantRolePerm
  );

  // revokeRolePermissions (POST)
  // ----------------------------
  //
  // Revoke a specific Permissions for a specific Role.
  //
  // Required payload:
  // - uuid
  // - permission

  server.post('/api/revokeRolePermission',
    ensureUserIsLoggedIn,
    fifo.revokeRolePerm
  );

  // metadataRoleSetAll (POST)
  // -------------------------
  //
  // Sets the entire metadata object for a specific Role.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataRoleSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataRoleSetAll
  );

  // metadataRoleDelAll (POST)
  // -------------------------
  //
  // Deletes a Role's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataRoleDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataRoleDelAll
  );

  // metadataRoleSet (POST)
  // ----------------------
  //
  // Sets the metadata - for a deep key - for a specific Role.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataRoleSet',
    ensureUserIsLoggedIn,
    fifo.metadataRoleSet
  );

  // metadataRoleDel (POST)
  // ----------------------
  //
  // Deletes a Role's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataRoleDel',
    ensureUserIsLoggedIn,
    fifo.metadataRoleDel
  );

  // ORGANIZATIONS
  // =============

  // listOrganizations (POST)
  // ------------------------
  //
  // List all the Organizations in the database.
  //
  // No Required payload.

  server.post('/api/listOrganizations',
    ensureUserIsLoggedIn,
    fifo.listOrganizations
  );

  // createOrganization (POST)
  // -------------------------
  //
  // Create a new Organization.
  //
  // Required payload:
  // - orgName
  //
  // Meta Payload
  // - billing_email
  // - phone
  // - street
  // - city
  // - state
  // - zip

  server.post('/api/createOrganization',
    ensureUserIsLoggedIn,
    fifo.createOrganization
  );

  // getOrganization (POST)
  // ----------------------
  //
  // Get a specific Organization.
  //
  // Required payload:
  // - uuid

  server.post('/api/getOrganization',
    ensureUserIsLoggedIn,
    fifo.getOrganization
  );

  // deleteOrganization (POST)
  // -------------------------
  //
  // Delete a specific Organization.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteOrganization',
    ensureUserIsLoggedIn,
    fifo.deleteOrganization
  );

  // listOrganizationTriggers (POST)
  // -------------------------------
  //
  // List the Triggers for an Organization.
  //
  // Required payload:
  // - uuid

  server.post('/api/listOrganizationTriggers',
    ensureUserIsLoggedIn,
    fifo.listOrganizationTriggers
  );

  // addOrganizationTrigger (POST)
  // -----------------------------
  //
  // Add a new Trigger to an Organization.
  //
  // Required payload:
  // - uuid
  // - role_uuid
  // - permission_role
  // - permission

  server.post('/api/addOrganizationTrigger',
    ensureUserIsLoggedIn,
    fifo.addOrganizationTrigger
  );

  // delOrganizationTrigger (POST)
  // -----------------------------
  //
  // Remove a Trigger from an Organization.
  //
  // Required payload:
  // - uuid
  // - role_uuid
  // - permission_role
  // - permission

  server.post('/api/delOrganizationTrigger',
    ensureUserIsLoggedIn,
    fifo.delOrganizationTrigger
  );

  // metadataOrganizationSetAll (POST)
  // ---------------------------------
  //
  // Sets the entire metadata object for a specific Organization.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - orgName
  // - billing_email
  // - phone
  // - street
  // - city
  // - state
  // - zip

  server.post('/api/metadataOrganizationSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataOrganizationSetAll
  );

  // metadataOrganizationDelAll (POST)
  // ---------------------------------
  //
  // Deletes an Organization's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataOrganizationDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataOrganizationDelAll
  );

  // metadataOrganizationSet (POST)
  // ------------------------------
  //
  // Sets the metadata - for a deep key - for a specific Organization.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataOrganizationSet',
    ensureUserIsLoggedIn,
    fifo.metadataOrganizationSet
  );

  // metadataOrganizationDel (POST)
  // ------------------------------
  //
  // Deletes an Organization's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataOrganizationDel',
    ensureUserIsLoggedIn,
    fifo.metadataOrganizationDel
  );

  // HYPERVISORS
  // ===========

  // listHypervisors (POST)
  // ----------------------
  //
  // List all the Hypervisors in the database.
  //
  // No Required payload.

  server.post('/api/listHypervisors',
    ensureUserIsLoggedIn,
    fifo.listHypervisors
  );

  // getHypervisor (POST)
  // --------------------
  //
  // Get a specific Hypervisor.
  //
  // Required payload:
  // - uuid

  server.post('/api/getHypervisor',
    ensureUserIsLoggedIn,
    fifo.getHypervisor
  );

  // aliasHypervisor (POST)
  // ----------------------
  //
  // Create an alias for a specific Hypervisor.
  //
  // Required payload:
  // - uuid
  // - alias

  server.post('/api/aliasHypervisor',
    ensureUserIsLoggedIn,
    fifo.aliasHypervisor
  );

  // metadataHypervisorSetAll (POST)
  // -------------------------------
  //
  // Sets the entire metadata object for a specific Hypervisor.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataHypervisorSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataHypervisorSetAll
  );

  // metadataHypervisorDelAll (POST)
  // -------------------------------
  //
  // Deletes a Hypervisor's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataHypervisorDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataHypervisorDelAll
  );

  // metadataHypervisorSet (POST)
  // ----------------------------
  //
  // Sets the metadata - for a deep key - for a specific Hypervisor.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataHypervisorSet',
    ensureUserIsLoggedIn,
    fifo.metadataHypervisorSet
  );

  // metadataHypervisorDel (POST)
  // ----------------------------
  //
  // Deletes a Hypervisor's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataHypervisorDel',
    ensureUserIsLoggedIn,
    fifo.metadataHypervisorDel
  );

  // characteristicHypervisorSet (POST)
  // ----------------------------------
  //
  // Adds a characteristic to a specific Hypervisor.
  //
  // Required payload:
  // - uuid
  // - characteristic_key
  // - characteristic_value

  server.post('/api/characteristicHypervisorSet',
    ensureUserIsLoggedIn,
    fifo.characteristicHypervisorSet
  );

  // characteristicHypervisorDel (POST)
  // ----------------------------------
  //
  // Deletes a characteristic of a specific Hypervisor.
  //
  // Required payload:
  // - uuid
  // - characteristic_key

  server.post('/api/characteristicHypervisorDel',
    ensureUserIsLoggedIn,
    fifo.characteristicHypervisorDel
  );

  // VMS
  // ===

  // listVMS (POST)
  // --------------
  //
  // List all the VMs in the database.
  //
  // No Required payload.
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/listVMs',
    ensureUserIsLoggedIn,
    fifo.listVMs
  );

  // createVM (POST)
  // ---------------
  //
  // Create a new VM.
  //
  // Required payload:
  // - dataset_uuid
  // - package_uuid
  // - config
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/createVM',
    ensureUserIsLoggedIn,
    fifo.createVM
  );

  // getVM (POST)
  // ------------
  //
  // Get a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/getVM',
    ensureUserIsLoggedIn,
    fifo.getVM
  );

  // runActionVM (POST)
  // ------------------
  //
  // Run an action on a specific VM.
  //
  // Required payload:
  // - uuid
  // - action
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/runActionVM',
    ensureUserIsLoggedIn,
    fifo.runActionVM
  );

  // runStartVM (POST)
  // -----------------
  //
  // Start a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/runStartVM',
    ensureUserIsLoggedIn,
    fifo.runStartVM
  );

  // runStopVM (POST)
  // ----------------
  //
  // Stop a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/runStopVM',
    ensureUserIsLoggedIn,
    fifo.runStopVM
  );

  // runRebootVM (POST)
  // ------------------
  //
  // Reboot a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/runRebootVM',
    ensureUserIsLoggedIn,
    fifo.runRebootVM
  );

  // runForceStopVM (POST)
  // ---------------------
  //
  // Force-stop a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/runForceStopVM',
    ensureUserIsLoggedIn,
    fifo.runForceStopVM
  );

  // runForceRebootVM (POST)
  // -----------------------
  //
  // Force-reboot a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/runForceRebootVM',
    ensureUserIsLoggedIn,
    fifo.runForceRebootVM
  );

  // updateConfigVM (PUT)
  // --------------------
  //
  // Update the configuration for a specific VM
  //
  // Required payload:
  // - uuid
  // - config
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/updateConfigVM',
    ensureUserIsLoggedIn,
    fifo.updateConfigVM
  );

  // updatePackageVM (PUT)
  // ---------------------
  //
  // Update the package for a specific VM
  //
  // Required payload:
  // - uuid
  // - package
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/updatePackageVM',
    ensureUserIsLoggedIn,
    fifo.updatePackageVM
  );

  // deleteVM (POST)
  // ---------------
  //
  // Delete a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/deleteVM',
    ensureUserIsLoggedIn,
    fifo.deleteVM
  );

  // addVMNic (POST)
  // ---------------
  //
  // Add a NIC to a specific VM.
  //
  // Required payload:
  // - uuid
  // - nic_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/addVMNic',
    ensureUserIsLoggedIn,
    fifo.addVMNic
  );

  // makeVMPrimaryNic (POST)
  // -----------------------
  //
  // Make a NIC the primary for a specific VM.
  //
  // Required payload:
  // - uuid
  // - nic_mac
  // *** note that the mac is NOT the uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/makeVMPrimaryNic',
    ensureUserIsLoggedIn,
    fifo.makeVMPrimaryNic
  );

  // deleteVMNic (POST)
  // ------------------
  //
  // Delete a specific VM.
  //
  // Required payload:
  // - uuid
  // - nic_mac
  // *** note that the mac is NOT the uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/deleteVMNic',
    ensureUserIsLoggedIn,
    fifo.deleteVMNic
  );

  // listVMSnapshots (POST)
  // ----------------------
  //
  // List all snapshots for a specific VM.
  //
  // No Required payload.
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/listVMSnapshots',
    ensureUserIsLoggedIn,
    fifo.listVMSnapshots
  );

  // createVMSnapshot (POST)
  // -----------------------
  //
  // Create a new snapshot of a specific VM.
  //
  // Required payload:
  // - uuid
  // - comment
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/createVMSnapshot',
    ensureUserIsLoggedIn,
    fifo.createVMSnapshot
  );

  // getVMSnapshot (POST)
  // --------------------
  //
  // Get a specific snapshot from a specific VM.
  //
  // Required payload:
  // - uuid
  // - snapshot_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/getVMSnapshot',
    ensureUserIsLoggedIn,
    fifo.getVMSnapshot
  );

  // rollbackVMSnapshot (POST)
  // -------------------------
  //
  // Rollback a specific VM snapshot. *** not yet implemented in project-fifo ***
  //
  // Required payload:
  // - uuid
  // - snapshot_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/rollbackVMSnapshot',
    ensureUserIsLoggedIn,
    fifo.rollbackVMSnapshot
  );

  // deleteVMSnapshot (POST)
  // -----------------------
  //
  // Delete a specific snapshot from a specific VM.
  //
  // Required payload:
  // - uuid
  // - snapshot_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/deleteVMSnapshot',
    ensureUserIsLoggedIn,
    fifo.deleteVMSnapshot
  );

  // listVMBackups (POST)
  // ----------------------
  //
  // List all Backups for a specific VM.
  //
  // No Required payload.
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/listVMBackups',
    ensureUserIsLoggedIn,
    fifo.listVMBackups
  );

  // createVMBackup (POST)
  // -----------------------
  //
  // Create a new Backup of a specific VM.
  //
  // Required payload:
  // - uuid
  // - comment
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/createVMBackup',
    ensureUserIsLoggedIn,
    fifo.createVMBackup
  );

  // getVMBackup (POST)
  // --------------------
  //
  // Get a specific Backup from a specific VM.
  //
  // Required payload:
  // - uuid
  // - backup_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/getVMBackup',
    ensureUserIsLoggedIn,
    fifo.getVMBackup
  );

  // rollbackVMBackup (POST)
  // -------------------------
  //
  // Rollback a specific VM Backup. *** not yet implemented in project-fifo ***
  //
  // Required payload:
  // - uuid
  // - backup_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/rollbackVMBackup',
    ensureUserIsLoggedIn,
    fifo.rollbackVMBackup
  );

  // deleteVMBackup (POST)
  // -----------------------
  //
  // Delete a specific Backup from a specific VM.
  //
  // Required payload:
  // - uuid
  // - backup_uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/deleteVMBackup',
    ensureUserIsLoggedIn,
    fifo.deleteVMBackup
  );

  // metadataVMSetAll (POST)
  // -----------------------
  //
  // Sets the entire metadata object for a specific VM.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/metadataVMSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataVMSetAll
  );

  // metadataVMDelAll (POST)
  // -----------------------
  //
  // Deletes a VM's entire metadata object.
  //
  // Required payload:
  // - uuid
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/metadataVMDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataVMDelAll
  );

  // metadataVMSet (POST)
  // --------------------
  //
  // Sets the metadata - for a deep key - for a specific VM.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/metadataVMSet',
    ensureUserIsLoggedIn,
    fifo.metadataVMSet
  );

  // metadataVMDel (POST)
  // --------------------
  //
  // Deletes a VM's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Optional Payload
  // - dc (will assume endpoint 0 if absent)

  server.post('/api/metadataVMDel',
    ensureUserIsLoggedIn,
    fifo.metadataVMDel
  );

  // NETWORKS
  // ========

  // listNetworks (POST)
  // -------------------
  //
  // List all the Networks in the database.
  //
  // No Required payload.

  server.post('/api/listNetworks',
    ensureUserIsLoggedIn,
    fifo.listNetworks
  );

  // createNetwork (POST)
  // --------------------
  //
  // Create a new Network.
  //
  // Required payload:
  // - networkName
  //
  // Meta Payload
  // - description

  server.post('/api/createNetwork',
    ensureUserIsLoggedIn,
    fifo.createNetwork
  );

  // getNetwork (POST)
  // -----------------
  //
  // Get a specific Network.
  //
  // Required payload:
  // - uuid

  server.post('/api/getNetwork',
    ensureUserIsLoggedIn,
    fifo.getNetwork
  );

  // deleteNetwork (POST)
  // --------------------
  //
  // Delete a specific Network.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteNetwork',
    ensureUserIsLoggedIn,
    fifo.deleteNetwork
  );

  // addNetworkIPrange (POST)
  // ------------------------
  //
  // Add an IPrange to a specific Network.
  //
  // Required payload:
  // - uuid
  // - iprange_uuid

  server.post('/api/addNetworkIPrange',
    ensureUserIsLoggedIn,
    fifo.addNetworkIPrange
  );

  // delNetworkIPrange (POST)
  // ------------------------
  //
  // Delete an IPrange from a specific Network.
  //
  // Required payload:
  // - uuid
  // - iprange_uuid

  server.post('/api/delNetworkIPrange',
    ensureUserIsLoggedIn,
    fifo.delNetworkIPrange
  );

  // metadataNetworkSetAll (POST)
  // ----------------------------
  //
  // Sets the entire metadata object for a specific Network.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataNetworkSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataNetworkSetAll
  );

  // metadataNetworkDelAll (POST)
  // ----------------------------
  //
  // Deletes a Network's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataNetworkDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataNetworkDelAll
  );

  // metadataNetworkSet (POST)
  // -------------------------
  //
  // Sets the metadata - for a deep key - for a specific Network.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataNetworkSet',
    ensureUserIsLoggedIn,
    fifo.metadataNetworkSet
  );

  // metadataNetworkDel (POST)
  // -------------------------
  //
  // Deletes a Network's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataNetworkDel',
    ensureUserIsLoggedIn,
    fifo.metadataNetworkDel
  );

  // IPRANGES
  // ========

  // listIPranges (POST)
  // -------------------
  //
  // List all the IPranges in the database.
  //
  // No Required payload.

  server.post('/api/listIPranges',
    ensureUserIsLoggedIn,
    fifo.listIPranges
  );

  // createIPrange (POST)
  // --------------------
  //
  // Create a new IPrange.
  //
  // Required payload:
  // - iprangeName
  // - network
  // - gateway
  // - netmask
  // - first
  // - last
  // - vlan
  // - tag
  //
  // Meta Payload
  // - description

  server.post('/api/createIPrange',
    ensureUserIsLoggedIn,
    fifo.createIPrange
  );

  // getIPrange (POST)
  // -----------------
  //
  // Get a specific IPrange.
  //
  // Required payload:
  // - uuid

  server.post('/api/getIPrange',
    ensureUserIsLoggedIn,
    fifo.getIPrange
  );

  // deleteIPrange (POST)
  // --------------------
  //
  // Delete a specific IPrange.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteIPrange',
    ensureUserIsLoggedIn,
    fifo.deleteIPrange
  );

  // obtainIP (POST)
  // ---------------
  //
  // Get a specific IPrange. *** not yet implemented in project-fifo ***
  //
  // Required payload:
  // - uuid

  server.post('/api/obtainIP',
    ensureUserIsLoggedIn,
    fifo.obtainIP
  );

  // releaseIP (POST)
  // ----------------
  //
  // Delete a specific IPrange. *** not yet implemented in project-fifo ***
  //
  // Required payload:
  // - uuid
  // - ip

  server.post('/api/releaseIP',
    ensureUserIsLoggedIn,
    fifo.releaseIP
  );

  // metadataIPrangeSetAll (POST)
  // ----------------------------
  //
  // Sets the entire metadata object for a specific IPrange.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataIPrangeSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataIPrangeSetAll
  );

  // metadataIPrangeDelAll (POST)
  // ----------------------------
  //
  // Deletes an IPrange's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataIPrangeDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataIPrangeDelAll
  );

  // metadataIPrangeSet (POST)
  // -------------------------
  //
  // Sets the metadata - for a deep key - for a specific IPrange.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataIPrangeSet',
    ensureUserIsLoggedIn,
    fifo.metadataIPrangeSet
  );

  // metadataIPrangeDel (POST)
  // -------------------------
  //
  // Deletes an IPrange's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataIPrangeDel',
    ensureUserIsLoggedIn,
    fifo.metadataIPrangeDel
  );

  // DATASETS
  // ========

  // listDatasets (POST)
  // -------------------
  //
  // List all the Datasets in the database.
  //
  // No Required payload.

  server.post('/api/listDatasets',
    ensureUserIsLoggedIn,
    fifo.listDatasets
  );

  // createDataset (POST)
  // --------------------
  //
  // Create a new Dataset.
  //
  // Required payload:
  // - datasetUrl
  // - datasetName
  //
  // Meta Payload
  // - description

  server.post('/api/createDataset',
    ensureUserIsLoggedIn,
    fifo.createDataset
  );

  // getDataset (POST)
  // -----------------
  //
  // Get a specific Dataset.
  //
  // Required payload:
  // - uuid

  server.post('/api/getDataset',
    ensureUserIsLoggedIn,
    fifo.getDataset
  );

  // setDatasetItem (POST)
  // ---------------------
  //
  // Set a key/value pair for a specific Dataset.
  //
  // Required payload:
  // - uuid
  // - key_name
  // - key_value

  server.post('/api/setDatasetItem',
    ensureUserIsLoggedIn,
    fifo.setDatasetItem
  );

  // deleteDataset (POST)
  // --------------------
  //
  // Delete a specific Dataset.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteDataset',
    ensureUserIsLoggedIn,
    fifo.deleteDataset
  );

  // metadataDatasetSetAll (POST)
  // ----------------------------
  //
  // Sets the entire metadata object for a specific Dataset.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataDatasetSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataDatasetSetAll
  );

  // metadataDatasetDelAll (POST)
  // ----------------------------
  //
  // Deletes a Dataset's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataDatasetDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataDatasetDelAll
  );

  // metadataDatasetSet (POST)
  // -------------------------
  //
  // Sets the metadata - for a deep key - for a specific Dataset.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataDatasetSet',
    ensureUserIsLoggedIn,
    fifo.metadataDatasetSet
  );

  // metadataDatasetDel (POST)
  // -------------------------
  //
  // Deletes a Dataset's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataDatasetDel',
    ensureUserIsLoggedIn,
    fifo.metadataDatasetDel
  );

  // PACKAGES
  // ========

  // listPackages (POST)
  // -------------------
  //
  // List all the Packages in the database.
  //
  // No Required payload.

  server.post('/api/listPackages',
    ensureUserIsLoggedIn,
    fifo.listPackages
  );

  // createPackage (POST)
  // --------------------
  //
  // Create a new Package.
  //
  // Required payload:
  // - packageName
  //
  // Meta Payload
  // - description

  server.post('/api/createPackage',
    ensureUserIsLoggedIn,
    fifo.createPackage
  );

  // getPackage (POST)
  // -----------------
  //
  // Get a specific Package.
  //
  // Required payload:
  // - uuid

  server.post('/api/getPackage',
    ensureUserIsLoggedIn,
    fifo.getPackage
  );

  // deletePackage (POST)
  // --------------------
  //
  // Delete a specific Package.
  //
  // Required payload:
  // - uuid

  server.post('/api/deletePackage',
    ensureUserIsLoggedIn,
    fifo.deletePackage
  );

  // metadataPackageSetAll (POST)
  // ----------------------------
  //
  // Sets the entire metadata object for a specific Package.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataPackageSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataPackageSetAll
  );

  // metadataPackageDelAll (POST)
  // ----------------------------
  //
  // Deletes a Package's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataPackageDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataPackageDelAll
  );

  // metadataPackageSet (POST)
  // -------------------------
  //
  // Sets the metadata - for a deep key - for a specific Package.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataPackageSet',
    ensureUserIsLoggedIn,
    fifo.metadataPackageSet
  );

  // metadataPackageDel (POST)
  // -------------------------
  //
  // Deletes a Package's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataPackageDel',
    ensureUserIsLoggedIn,
    fifo.metadataPackageDel
  );

  // DTRACES
  // =======

  // listDtraces (POST)
  // ------------------
  //
  // List all the Dtraces in the database.
  //
  // No Required payload.

  server.post('/api/listDtraces',
    ensureUserIsLoggedIn,
    fifo.listDtraces
  );

  // createDtrace (POST)
  // -------------------
  //
  // Create a new Dtrace.
  //
  // Required payload:
  // - dtraceName
  // - script
  // - config
  //
  // Meta Payload
  // - description

  server.post('/api/createDtrace',
    ensureUserIsLoggedIn,
    fifo.createDtrace
  );

  // getDtrace (POST)
  // ----------------
  //
  // Get a specific Dtrace.
  //
  // Required payload:
  // - uuid

  server.post('/api/getDtrace',
    ensureUserIsLoggedIn,
    fifo.getDtrace
  );

  // deleteDtrace (POST)
  // -------------------
  //
  // Delete a specific Dtrace.
  //
  // Required payload:
  // - uuid

  server.post('/api/deleteDtrace',
    ensureUserIsLoggedIn,
    fifo.deleteDtrace
  );

  // metadataDtraceSetAll (POST)
  // ---------------------------
  //
  // Sets the entire metadata object for a specific Dtrace.
  //
  // Required payload:
  // - uuid
  //
  // Meta Payload
  // - description

  server.post('/api/metadataDtraceSetAll',
    ensureUserIsLoggedIn,
    fifo.metadataDtraceSetAll
  );

  // metadataDtraceDelAll (POST)
  // ---------------------------
  //
  // Deletes a Dtrace's entire metadata object.
  //
  // Required payload:
  // - uuid

  server.post('/api/metadataDtraceDelAll',
    ensureUserIsLoggedIn,
    fifo.metadataDtraceDelAll
  );

  // metadataDtraceSet (POST)
  // ------------------------
  //
  // Sets the metadata - for a deep key - for a specific Dtrace.
  //
  // Required payload:
  // - uuid
  // - meta_path
  //
  // Meta Payload
  // - meta_data

  server.post('/api/metadataDtraceSet',
    ensureUserIsLoggedIn,
    fifo.metadataDtraceSet
  );

  // metadataDtraceDel (POST)
  // ------------------------
  //
  // Deletes a Dtrace's metadata - for a deep key.
  //
  // Required payload:
  // - uuid
  // - meta_path

  server.post('/api/metadataDtraceDel',
    ensureUserIsLoggedIn,
    fifo.metadataDtraceDel
  );

  // 503 - protected page failure
  // ============================

  server.get('/503', function(req, res) {
    res.render('503.ejs');
  });

  // 404 !!! place no routes after this one !!!
  // ==========================================

  server.get('*', function(req, res) {
    res.render('404.ejs');
  });

};