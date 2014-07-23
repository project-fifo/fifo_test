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
    // required for all emails
    "test_email": "rsahm@lucerahq.com",
    // optional arguments
    "test_fullName": "Tester McGee",
    "test_name": "Tester",
    "test_password": "!@#$%^^",
    "test_code": "!@#$%^^",
    "test_orgName": "Your Co",
    "test_company": "Your Co",
    "test_title": "Other",
    "test_phone": "123-123-1234",
    "test_confirmed": "2014-01-01 16:59:01",
    "test_terms": "2014-01-01 16:59:01",
    "test_privacy": "2014-01-01 16:59:01",
    "test_service": "2014-01-01 16:59:01",
    "test_address1": "123 Main St",
    "test_address2": "Apt 12L",
    "test_city": "New York",
    "test_state": "NY",
    "test_zip": "10010",
    "test_country": "US",
    "test_os": "centos",
    "test_hardware": "16",
    "test_datacenter": [{
        dc: 'LD',
        quantity: 32
    }, {
        dc: 'NY',
        quantity: 12
    }],
    "test_key_id": "ssh102394",
    "test_message": "I'd like some more information about your organization!",
    "test_subject": "Information request",
    "test_adminUsers": [{
        name: 'admin 1',
        email: 'test20140417dg@mailinator.com'
    }],
    "test_first_name": "tester",
    "test_last_name": "mcgee",
    "test_username": "testing_username",
    "test_signupComment": "n/a",
    "test_group_name": "Company Role A",
    // which emails to send, and which fields to include
    "test_mailMatrix": {
        'signup': ['name', 'password', 'orgName'],
        'signup2': ['name', 'password', 'orgName'],
        'emailAdmin': ['adminUsers', 'name', 'orgName', 'first_name', 'last_name', 'username', 'signupComment'],
        'forgot': ['name', 'code'],
        'pwdNew': ['name'],
        'accountReq': [
            'name',
            'fullName',
            'company',
            'title',
            'phone',
            'confirmed',
            'terms',
            'privacy',
            'service',
            'address1',
            'address2',
            'city',
            'state',
            'zip',
            'country'
        ],
        'upgraded': ['name'],
        'machineReq': [
            'name',
            'os',
            'hardware',
            'datacenter',
            'confirmed'
        ],
        'sshNew': ['name', 'key_id'],
        'sshDel': ['name', 'key_id'],
        'roleAdded': ['name', 'group_name'],
        'roleAddedAdmin': ['name', 'group_name'],
        'roleAddedReadOnly': ['name', 'group_name'],
        'roleAddedUser': ['name', 'group_name'],
        'generalC': ['fullName', 'message', 'subject'],
        'salesC': ['fullName', 'message', 'subject'],
        'supportC': ['fullName', 'message', 'subject']
    }
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

describe('Send an email', function() {
    this.timeout(4000);
    it('Should send the admin user signup email', function(done) {
        Q.delay(2000).then(function() {
            var emailName = 'signup',
                mailVars = LTH.convertEmailArguments(emailName);
            request.post('localhost:3000/api/mailerTest')
                .send(mailVars)
                .end(function(res) {
                    if (res.body.success === 'success') {
                        done();
                    }
                });
        });
    });
});

describe('Send an email', function() {
    it('Should send the secondary user signup email', function(done) {
        var emailName = 'signup2',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send a user\'s details to the org admin', function(done) {
        var emailName = 'emailAdmin',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the forgot password email', function(done) {
        var emailName = 'forgot',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the password changed email', function(done) {
        var emailName = 'pwdNew',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the account upgrade request receipt email', function(done) {
        var emailName = 'accountReq',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the account upgrade request completed email', function(done) {
        var emailName = 'upgraded',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the new machine request receipt email', function(done) {
        var emailName = 'machineReq',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the ssh key added email', function(done) {
        var emailName = 'sshNew',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the ssh key deleted email', function(done) {
        var emailName = 'sshDel',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the role added - normal - email', function(done) {
        var emailName = 'roleAdded',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the role added - admin - email', function(done) {
        var emailName = 'roleAddedAdmin',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the role added - read only - email', function(done) {
        var emailName = 'roleAddedReadOnly',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the role added - user - email', function(done) {
        var emailName = 'roleAddedUser',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the general contact email', function(done) {
        var emailName = 'generalC',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    it('Should send the sales contact email', function(done) {
        var emailName = 'salesC',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    done();
                }
            });
    });
});

describe('Send an email', function() {
    this.timeout(4000);
    it('Should send the support contact email', function(done) {
        var emailName = 'supportC',
            mailVars = LTH.convertEmailArguments(emailName);
        request.post('localhost:3000/api/mailerTest')
            .send(mailVars)
            .end(function(res) {
                if (res.body.success === 'success') {
                    Q.delay(2000).then(function() {
                        done();
                    });
                }
            });
    });
});