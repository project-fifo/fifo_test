// PUBLIC METHODS
// ==============

require('node-fifo');
var util = require('util'),
    http = require('http'),
    request = require('request'),
    Q = require('q');

// CREATE ACCOUNT
// ==============

var _activityLog = null,
    _token = {},
    _username = null,
    _password = null,
    _which = 0,
    _debug = false,
    _tokenCount = 0;

module.exports.setActivityLog = function(logger) {
    _activityLog = logger;
}

module.exports.whichFifo = function(which) {
    if (which !== undefined)
        _which = which;
    return _which;
}

var setWhichDc = function(req) {
    var dc = parseInt(req.body.dc, 10);
    if (!('dc' in req.body))
        dc = req.session._loggedInFifo;
    module.exports.whichFifo(dc);
};

module.exports.whichFifoLoggedIn = function(req, res, callback) {
    module.exports.whichFifo(req.session._loggedInFifo);
    if (callback)
        callback();
}

module.exports.getToken = function(session) {
    console.log('Token retrieved ' + (++_tokenCount) + ' times.');
    return (('token' in session) && (_which in session.token)) ? session.token[_which] : '';
}

module.exports.getTokens = function(session) {
    console.log('Token retrieved ' + (++_tokenCount) + ' times.');
    return ('token' in session) ? session.token : {};
}

module.exports.getTokensInternal = function() {
    console.log('Token retrieved ' + (++_tokenCount) + ' times.');
    return _token;
}

// Signup for a single user
module.exports.signupUser = function(req, res, next) {
    var randPass = function(len) {
        var randLetter = function(letters) {
            var min = 1,
                max = letters.length,
                rand = Math.floor(Math.random() * (max - min) + min);
            return ((max <= 1) ? letters : letters[rand]);
        },
            letterSets = ['0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789'],
            password = "";
        for (var i = 0; i < len; i++)
            password += randLetter(letterSets[0]);
        return password;
    };

    setWhichDc(req);

    // Create token with admin user
    console.log('Signup requested!');
    var userPass = randPass(12),
        token = FiFo.connect(Config.FiFo[_which].url, req.session._uid || _username, req.session._pwd || _password),
        user = token.then(function(obj) {
            // Create User
            console.log('Creating user!', req.body);
            req.body.password = userPass;
            var user = User.create(req.body.username, req.body.password, obj);
            return user;
        });

    user.then(function(user) {
        console.log('User data returned: ', user, user instanceof Array, user.length);
        var userFail = false
        if ((user instanceof Array) && ((user.length === 0) || (user.length === 1))) {
            userFail = true;
        }
        console.log(user, userFail);
        if (userFail || (('message' in user) && (user.message === 'Post failure!'))) {
            console.log('Creation failed!');
            var errorRegex = new RegExp(/^Error code (\d+) returned.$/),
                message = JSON.parse(JSON.stringify(user, ['stack', 'message'], 2)),
                errorMessage = 'An unknown error has occurred.',
                matches = errorRegex.exec(message[0].message);
            // console.log(message, message[0]);
            // console.log(errorRegex.test(message[0].message));
            if (matches !== null) {
                // console.log(matches);
                if (matches[1] === '500') {
                    errorMessage = 'A user already exists with that email!';
                } else {
                    errorMessage += ' Error code: ' + matches[1];
                }
            }
            res.send(200, {
                success: false,
                message: errorMessage
            });
            return '!';
        } else {
            req.session.uuid = user.uuid;
            // Create Meta Object
            var meta = {
                "email": req.body.email,
                "name": {
                    "first": req.body.first_name,
                    "last": req.body.last_name
                },
                "title": req.body.title || '',
                "genPass": userPass,
                "upgradeEnabled": "true"
            };
            // Set Metadata
            token.then(function(obj) {
                User.metadataSet(user.uuid, "lucera3", meta, obj);
            });
            return token;
        }
    })
        .then(function(obj) {
            if (obj !== '!') {
                // Create Organization
                var org = Organization.get(req.body.orgUuid, obj);
                // var org = Organization.create(req.body.orgName, obj);
                return org;
            } else
                return obj;
        })
    // .then(function(org){
    //     if (org !== '!') {
    //         // Create Meta Object
    //         var meta = {
    //                 "company": req.body.orgName,
    //                 "phone": req.body.phone || '',
    //                 "billing_email": req.body.billing_email || '',
    //                 "address": {
    //                     "street": req.body.street || '',
    //                     "city": req.body.city || '',
    //                     "state": req.body.state || '',
    //                     "zip": req.body.zip || ''
    //                 },
    //                 "companyName": req.body.orgName
    //             };
    //         // Set Org Meta
    //         token.then(function(obj){
    //             //console.log(org.uuid, meta, token);
    //             Organization.metadata_set(org.uuid, "lucera3", meta, obj);
    //         });
    //         return org;
    //     } else
    //         return org;
    // })
    .then(function(org) {
        if (org !== '!') {
            user.then(function(user) {
                token.then(function(obj) {
                    User.activeOrg(user.uuid, org.uuid, obj);
                });
            });
        } else
            return org;
    })
        .then(function(org) {
            if (org !== '!') {
                // Send Response
                // res.send(200, {0:'/'});
                next();
            }
        }).done();
};

// Signup for an organization
module.exports.signup = function(req, res, next) {
    var randPass = function(len) {
        var randLetter = function(letters) {
            var min = 1,
                max = letters.length,
                rand = Math.floor(Math.random() * (max - min) + min);
            return ((max <= 1) ? letters : letters[rand]);
        },
            letterSets = ['0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789'],
            password = "";
        for (var i = 0; i < len; i++)
            password += randLetter(letterSets[0]);
        return password;
    },
        userPass = randPass(12);

    _which = 0;
    setWhichDc({
        body: {
            dc: _which
        }
    });

    var badEmailPattern = /^.+[@](gmail|yahoo|hotmail|outlook)[.]/i,
        signupTaskUrl = '',
        signupTimer = null,
        signupUuid = '',
        signupTotalItems = -1,
        signupCurrentItem = -1,
        dataStruct = {
            "name": req.body.orgName,
            "mail": req.body.username,
            "meta": {
                "org": {
                    "lucera3": {
                        "company": req.body.orgName,
                        "phone": req.body.phone || '',
                        "billing_email": req.body.billing_email || '',
                        "address": {
                            "street": req.body.street || '',
                            "city": req.body.city || '',
                            "state": req.body.state || '',
                            "zip": req.body.zip || ''
                        },
                        "companyName": req.body.orgName,
                        "promoCode": req.body.promoCode || '',
                        "signupComment": req.body.signupComment || ''
                    }
                },
                "user": {
                    "lucera3": {
                        "email": req.body.email,
                        "name": {
                            "first": req.body.first_name,
                            "last": req.body.last_name
                        },
                        "title": req.body.title || '',
                        "genPass": userPass
                    }
                }
            }
        };

    if (badEmailPattern.test(req.body.username)) {
        res.send(403, {
            success: false,
            message: 'You may not register with a generic email - please register with a corporate email account.'
        });
    } else {

        if ('fasttrak' in req.session) {
            dataStruct.meta.user.lucera3.fasttrak = true;
        }

        var results = FiFo.signup(Config.FiFo[_which].url, dataStruct);

        results.then(function(data) {
            console.log(data);
            if (data.success === 'success') {
                signupTaskUrl = data.location;
                signupTimer = setTimeout(checkSignupTask, 1000);
            }
            res.send(200, data);
        });
    }

    function checkSignupTask() {
        if (!(/^https?:\/\//.test(signupTaskUrl))) {
            signupTaskUrl = Config.FiFo[0].url + signupTaskUrl;
        }
        console.log('Checking task at ', signupTaskUrl);
        var getReq = http.get(signupTaskUrl, function(res) {
            var responseParts = [];
            res.setEncoding('utf8');
            res.on("error", function(err) {
                signupTimer = setTimeout(checkSignupTask, 3000);
            });
            res.on("data", function(chunk) {
                console.log(chunk);
                var data = JSON.parse(chunk);
                if ('task' in data) {
                    signupUuid = data.task.uuid;
                    signupTotalItems = data.task.total,
                    signupCurrentItem = data.task.progress;
                    console.log(data.task.state);
                    switch (data.task.state) {
                        case 'pending':
                            signupTimer = setTimeout(checkSignupTask, 3000);
                            break;
                        case 'completed':
                            userPass = data.task.result.passwd;
                            sendSignupEmail();
                            break;
                        case 'failed':
                            break;
                    }
                }
            });
            res.on("end", function() {});
        });
        getReq.on("error", function(err) {
            // we just don't want the server to crash
            // otherwise, we don't care about this error..
        });
    }

    function sendSignupEmail() {
        var postData = {
            name: dataStruct.meta.user.lucera3.name.first,
            email: dataStruct.mail,
            password: userPass,
            orgName: dataStruct.name
        };

        console.log('Posting to email endpoint', postData);
        request.post({
            url: 'http://localhost:' + Config.listenPort + '/api/signupEmail',
            form: postData,
            email: dataStruct.mail,
            password: userPass
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        });
    }
};

// Relay a user's registration status from the fifo endpoint
module.exports.signupStatus = function(req, res, next) {

    console.log(req.body);
    var signupTaskUrl = req.body.task_url;
    if (!signupTaskUrl) {
        res.send(500, 'No url listed!');
        return;
    }
    if (!(/^https?:\/\//.test(signupTaskUrl))) {
        signupTaskUrl = Config.FiFo[0].url + signupTaskUrl;
    }

    console.log('Servicing customer request to check task at ', signupTaskUrl);
    var getReq = http.get(signupTaskUrl, function(res2) {
        var responseParts = [];
        res2.setEncoding('utf8');
        res2.on("error", function(err) {
            console.log(err);
            res.send(500, err);
        });
        res2.on("data", function(chunk) {
            console.log(chunk);
            var data = JSON.parse(chunk);
            res.send(200, data);
        });
        res2.on("end", function() {});
    });
    getReq.on("error", function(err) {
        console.log(err);
        res.send(500, err);
    });

}

// Upgrade a user to be able to create VMs
module.exports.upgradeUser = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Set the user as upgraded
            User.metadataSet(req.body.uuid, "lucera3", {
                "upgradeEnabled": true
            }, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
}

module.exports.checkAutoLogin = function(req, res, next) {

    console.log(req.query);
    if (!('code' in req.query)) {
        next();
    } else {
        var code = req.query.code,
            userFound = false,
            userUuid = '',
            username = '',
            token = FiFo.connect(Config.FiFo[_which].url, Config.FiFo[_which].username, Config.FiFo[_which].password, false);

        token.then(function(obj) {
            // Search for the user with this code..
            var dfd = getEndpointDataWithChildren('users', listUserFunc, listUserDetailFunc, token);
            dfd.then(function(data) {
                if (('users' in data) && ('ldata' in data.users))
                    for (var key in data.users.ldata) {
                        var thisUser = data.users.ldata[key],
                            metadata = thisUser.metadata;
                        username = thisUser.name;
                        if (('lucera3' in metadata) && ('genPass' in metadata.lucera3)) {
                            // console.log('Checking :', username, metadata.lucera3.genPass, code);
                            if (metadata.lucera3.genPass === code) {
                                userFound = true;
                                userUuid = key;
                                console.log('Match found, time to login automatically!', username, code);
                                break;
                            }
                        }
                    }
                return data;
            })
                .done(function() {
                    if (userFound) {
                        req.body.username = username;
                        req.body.password = code;
                        module.exports.loginAuto(req, res, next, true);
                    } else {
                        res.locals.errorMessage = 'Invalid code detected.';
                        next();
                    }
                });
        });
    }
}

// Upgrade a user to be able to create VMs
module.exports.setupCompanyAdminEmail = function(req, res, next) {
    console.log(req.body);
    setWhichDc(req);

    var roleFound = false,
        roleUuid = '',
        roleName = req.body.orgName + ' - Admins',
        token = FiFo.connect(Config.FiFo[_which].url, Config.FiFo[_which].username, Config.FiFo[_which].password);

    console.log('Search for role named:', roleName);
    token.then(function(obj) {
        // Search for the org
        var type = 'roles',
            dfd = getEndpointDataWithChildren(type, listRoleFunc, listRoleDetailFunc, token);
        dfd.then(function(data) {
            for (var key in data[type].ldata) {
                var thisRole = data[type].ldata[key],
                    metadata = thisRole.metadata,
                    // foundName = (('lucera3' in metadata) && ('name' in metadata.lucera3)) ? metadata.lucera3.name : thisRole.name;
                    foundName = thisRole.name;
                // console.log('checking these two names:', foundName, roleName);
                if (foundName === roleName) {
                    // console.log(req.body, thisRole);
                    roleFound = true;
                    roleUuid = key;
                    break;
                }
            }
            return data;
        })
            .done(function() {
                if (roleFound) {
                    console.log('Role found!', roleUuid);
                    var usersToEmail = [],
                        type = 'users',
                        dfd = getEndpointDataWithChildren(type, listUserFunc, listUserDetailFunc, token);
                    dfd.then(function(data) {
                        for (var key in data[type].ldata) {
                            var thisUser = data[type].ldata[key],
                                userRoles = thisUser.roles,
                                roleLoc = !userRoles || !userRoles.length ? -1 : userRoles.indexOf(roleUuid);
                            if (roleLoc > -1) {
                                usersToEmail.push({
                                    name: thisUser.metadata.lucera3.name.first || 'Administrator',
                                    email: thisUser.metadata.lucera3.email || ''
                                });
                            }
                        }
                        return data;
                    })
                        .done(function() {
                            if (usersToEmail.length) {
                                console.log('Admin user(s) found!', usersToEmail);
                                req.body.adminUsers = usersToEmail;
                                next();
                            } else {
                                res.send(403, {
                                    0: 'No admin users found'
                                });
                            }
                        });
                } else {
                    res.send(403, {
                        0: 'No such role'
                    });
                }
            });
    });
}

// AUTHENTICATION
// ==============

// Sessions

var getToken = function(req, res) {
    if (!(_which in req.session._token) && !req.session._token[_which] && !(_which in _token) && !_token[_which]) {
        if ((!_which in Config.FiFo) || (typeof(Config.FiFo[_which]) !== 'string')) {
            return Q({});
        }
        var token = FiFo.connect(Config.FiFo[_which].url, req.session._uid || _username, req.session._pwd || _password);
        token.then(function(obj) {
            _token[_which] = JSON.stringify(token.inspect().value);
            req.session._token[_which] = _token[_which];
            return token;
        });
    } else {
        for (var key in req.session._token) {
            _token[key] = req.session._token[key];
        }
        return Q(JSON.parse(req.session._token[_which] || _token[_which]));
    }
};

// The API kicks back 404 if your function signature adds addition vars (see loginAuto, below)
// and this overcomes the problem quite nicely.
module.exports.login = function(req, res, next) {
    module.exports.loginAuto(req, res, next);
}

module.exports.loginAuto = function(req, res, next, auto) {
    req.session._loggedInFifo = 0;
    req.session.loggedIn = false;
    var asynci = 0,
        asyncMax = Config.FiFo.length,
        userInfo = null,
        connectToEndpoint = function(req, res, url, username, password) {
            if (!('token' in req.session))
                req.session.token = {};
            if (!('_token' in req.session))
                req.session._token = {};
            console.log('connecting to ... ', url, username, (asynci === 0) || !req.session.loggedIn);
            var saveLogin = (asynci === 0) || !req.session.loggedIn,
                token = FiFo.connect(url, username, password, saveLogin ? false : true);
            token.then(function(obj) {
                // console.log('login results: ', obj);
                if ((obj.length === 0) || (obj.user === -1)) {
                    if (asynci < asyncMax) {
                        _token[asynci] = JSON.stringify({});
                        req.session.token[asynci] = {};
                        req.session._token[asynci] = _token[asynci];
                        return {};
                    } else {
                        if (!req.session.loggedIn) {
                            res.send(401, 'Invalid login.');
                            return {};
                        } else {
                            _token[asynci] = JSON.stringify(token.inspect().value);
                            req.session.token[asynci] = {};
                            req.session._token[asynci] = _token[asynci];
                            return {};
                        }
                    }
                } else {
                    if (!req.session.loggedIn) {
                        req.session.loggedIn = true;
                        req.session._loggedInFifo = asynci;
                        _which = asynci;
                        _tokenCount = 0;
                        // console.log('saved loggedin val!', req.session._loggedInFifo);
                        // console.log(req.ip, req.header('x-forwarded-for'), req.connection.remoteAddress);
                        // var ipAddr = req.headers["x-forwarded-for"];
                        // if (ipAddr) {
                        //     var list = ipAddr.split(",");
                        //     ipAddr = list[0];
                        // } else {
                        //     ipAddr = req.connection.remoteAddress;
                        // }
                        // var loginDetails = "Logged in on " + moment().format('LLLL') + ' from ' + ipAddr;
                        // // console.log(obj.user.uuid, loginDetails);
                        // token.then(function(objSave) {
                        //     User.metadataSet(obj.user.uuid, "lucera3", {
                        //         "loggedIn": loginDetails
                        //     }, objSave);
                        // });
                    }
                    _username = username;
                    _password = password;
                    req.session._uid = username;
                    req.session._pwd = password;
                    if (saveLogin) {
                        // console.log('saving uuid', obj.user.uuid);
                        req.session._uuid = obj.user.uuid;
                        req.session.user = obj.user;
                    }

                    _token[asynci] = JSON.stringify(token.inspect().value);
                    req.session.token[asynci] = obj.token;
                    req.session._token[asynci] = _token[asynci];

                    var user = obj.user;
                    // console.log('returning the user info: ', JSON.stringify(user));
                    return user;
                }
            }).then(function(user) {
                var successFn = function(req, res, userInfo) {
                    var activityVars = {
                        action: req.path,
                        metadata: {
                            "express-ip": req.ip,
                            "x-forwarded-for": req.headers["x-forwarded-for"],
                            "connection-remoteAddress": req.connection.remoteAddress,
                            "user": req.session.user || {},
                            "body": req.body
                        }
                    };
                    _activityLog.create({
                        body: activityVars,
                        session: req.session
                    }, res);
                    // console.log(auto, userInfo);
                    if (!auto) {
                        res.send(200, userInfo);
                    } else if (!userInfo.uuid) {
                        module.exports.login(req, res, next, auto);
                    } else {
                        if (userInfo)
                            res.writeHead(302, {
                                'Location': '/'
                                //add other headers here...
                            });
                        res.end();
                    }
                };
                // console.log(req.session._token);
                if (asynci === req.session._loggedInFifo) {
                    userInfo = user;
                }
                asynci++;
                // console.log(user);
                if (asynci < asyncMax) {
                    connectToEndpoint(req, res, Config.FiFo[asynci].url, username, password);
                } else {
                    if ((userInfo !== null) && (req.session.user !== undefined)) {
                        console.log('Session User:', req.session.user);
                        if (!req.session.user || !('metadata' in req.session.user) || !('lucera3' in req.session.user.metadata) || !('yubiKeyEnabled' in req.session.user.metadata.lucera3)) {
                            successFn(req, res, userInfo);
                        } else {
                            if (!('otp' in req.body) || (req.body.otp === '')) {
                                FiFo.resetSaved();
                                req.session.destroy(function() {
                                    res.send(449, {
                                        msg: 'YubiKey does not match this account.'
                                    });
                                });
                            } else {
                                var valid = false,
                                    yubiKeys = [];
                                yubikey1 = req.session.user.metadata.lucera3.yubiKey1 || '';
                                yubikey2 = req.session.user.metadata.lucera3.yubiKey2 || '',
                                yubikey3 = req.session.user.metadata.lucera3.yubiKey3 || '',
                                yubikey4 = req.session.user.metadata.lucera3.yubiKey4 || '',
                                yubikey5 = req.session.user.metadata.lucera3.yubiKey5 || '';
                                yubiKeys.push(yubikey1);
                                yubiKeys.push(yubikey2);
                                yubiKeys.push(yubikey3);
                                yubiKeys.push(yubikey4);
                                yubiKeys.push(yubikey5);
                                var newSuccessFn = function(req, res) {
                                    successFn(req, res, userInfo);
                                };
                                module.exports.validateYubiKey(req, res, newSuccessFn, yubiKeys);
                            }
                        }
                    } else {
                        successFn(req, res, userInfo);
                    }
                }
            }).done();
        };
    connectToEndpoint(req, res, Config.FiFo[asynci].url, req.body.username, req.body.password);
};

module.exports.logout = function() {
    FiFo.logout();
}

// Setup a user's yubikey hash
module.exports.setupYubiKey = function(req, res) {
    yubiPlus.init(Config.YubiKey.id, Config.YubiKey.secret);

    yubiPlus.verify(req.body.yubiKey, function(err, data) {
        if (err) {
            console.log(err);

            res.send(409, {
                msg: 'YubiKey could not be authenticated.'
            });
        } else {
            console.log(data);

            if (data.valid) {
                var uKey = data.identity;

                userModel.findOne({
                    email: req.session.user.email
                }, function(err, user) {
                    user.setPassword(req.body.password, function(err, user) {
                        if (err) {
                            console.log(err);
                            res.send(400, {
                                message: 'Error saving new password.  Please try again.'
                            });
                        } else {
                            user.yubiKey = uKey;
                            user.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    res.send(err);
                                } else {
                                    console.log('398: userSchema', user);
                                    req.session.user = user;
                                    res.send(200, {
                                        message: 'Account UbiKey Secured!'
                                    });
                                }
                            });
                        }
                    });
                });
            } else {
                res.send(409, {
                    msg: 'YubiKey could not be authenticated.'
                });
            }
        }
    });
}

// Validate a YubiKey submission
module.exports.validateYubiKey = function(req, res, successFn, yubiKeys) {

    if (!('otp' in req.body) || (req.body.otp === '')) {
        res.send(500, {
            msg: 'No YubiKey hash found.'
        });
    } else {
        yubiPlus.init(Config.YubiKey.id, Config.YubiKey.secret);

        yubiPlus.verify(req.body.otp, function(err, data) {
            // console.log(err, data);
            if (err) {
                req.session.destroy(function() {
                    res.send(500, {
                        msg: 'YubiKey failied to authenticate.'
                    });
                });
            } else {
                var yubiKeysShort = [];
                for (var i = 0; i < yubiKeys.length; i++)
                    yubiKeysShort.push(yubiKeys[i].substr(0, 12));
                if (data.valid && (yubiKeysShort.indexOf(data.identity) > -1)) {
                    req.session.accessGranted = true;
                    successFn(req, res);
                } else {
                    req.session.destroy(function() {
                        res.send(500, {
                            msg: 'YubiKey does not match this account.'
                        });
                    });
                }
            }
        });
    }
}

// Session Test
module.exports.sessionTest = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        var session = FiFo.sessionTest(obj.token, obj);
        session.then(function(sess) {
            console.log(sess);
        });
    });
};

// COMPILED DATA VIEWS
// ===================

var getEndpointData = function(func, token) {
    var deferred = Q.defer();
    token.then(function(obj) {
        func(obj).then(function(data) {
            deferred.resolve(data);
        });
    }).done();
    return deferred.promise;
}

var getEndpointDataWithChildren = function(type, funcList, funcChild, token, which) {
    var deferred = Q.defer(),
        responsePacked = {};
    if (!which)
        which = 0;
    token.then(function(obj) {
        if (_debug)
            console.log(obj);
        if (obj.user == -1) {
            deferred.resolve(responsePacked);
        } else {
            // test here if we can use the new functionality
            var testFuncDfd = funcList(obj, token, true);
            testFuncDfd.then(function(testData) {
                // this is the main test to see if the returned data is an array or not
                var arrayTest = (Object.prototype.toString.call(testData) === '[object Array]');
                // if it is, and the first item isn't an object, then we have an array of uuids - use the old way..
                if (arrayTest && (Object.prototype.toString.call(testData[0]) !== '[object Object]')) {
                    // console.log('legacy lookup method :(');
                    var dfdCache = [],
                        dfd = funcList(obj, token);
                    // Wait for the above to be done, and grab all the data
                    dfd.then(function(data) {
                        if (!(type in responsePacked))
                            responsePacked[type] = {
                                list: data,
                                ldata: {}
                            };
                        for (var i = 0; i < data.length; i++) {
                            var dfdChild = funcChild(data[i], obj, token);
                            dfdCache.push(dfdChild);
                            dfdChild.then(function(moreData) {
                                var tUuid = moreData.uuid ? moreData.uuid : moreData.dataset;
                                moreData['dc'] = which;
                                responsePacked[type].ldata[tUuid] = moreData;
                                // console.log('moreData!', moreData);
                            });
                        }

                        Q.allSettled(dfdCache)
                            .done(function() {
                                deferred.resolve(responsePacked);
                            });
                    });

                    // here we know it's the full data all in one shot, so we construct the list of uuids we'd get the old way, from the keys returned
                } else {
                    // console.log('new lookup method!');
                    if (type === 'dcs') {
                        var dcKey = 0;
                        for (var dcI in testData) {
                            var loggedIn = (_token[dcKey] !== '{}');
                            testData[dcI].loggedIn = loggedIn;
                            dcKey++;
                        }
                    }
                    var j,
                        keyList = [],
                        actualListData = {};
                    if (!arrayTest) {
                        for (var key in testData) {
                            keyList.push(key);
                            var newData = testData[key];
                            newData['dc'] = which;
                            testData[key] = newData;
                        }
                        actualListData = testData;
                    } else {
                        for (var key in testData) {
                            var keyUuid = testData[key].uuid ? testData[key].uuid : testData[key].dataset;
                            keyList.push(keyUuid);
                            var newData = testData[key];
                            newData['dc'] = which;
                            testData[key] = newData;
                            actualListData[keyUuid] = testData[key];
                        }
                    }
                    // console.log('keylist!', keyList, 'ldata!', actualListData);
                    // if (!(type in responsePacked))
                    //     responsePacked[type] = { list: [], ldata: {} };
                    // for(j=0; j<keyList.length; j++)
                    //     responsePacked[type].list.push(keyList[j]);
                    // for(var jkey in actualListData)
                    //     responsePacked[type].ldata[jkey] = JSON.parse(JSON.stringify(actualListData[jkey]))
                    // console.log(responsePacked);
                    responsePacked[type] = {
                        list: JSON.parse(JSON.stringify(keyList)),
                        ldata: JSON.parse(JSON.stringify(actualListData))
                    };
                    deferred.resolve(responsePacked);
                }
            });
        }
    }).done();
    return deferred.promise;
}

var getDataAndRespondA = function(req, res, func) {
    // Get the saved token for this user
    var token = getToken(req, res);
    token.then(function(obj) {
        // Run the passed in function, and grab the data
        var data = func(req, obj);
        return data;
    })
        .then(function(data) {
            // Send Response with the data
            res.send(200, data);
        }).done();
};

var getDataAndRespondB = function(req, res, func, next) {
    // Get the saved token for this user
    var token = getToken(req, res);
    token.then(function(obj) {
        // Run the passed in function
        func(req, obj);
    })

    if (!next) {
        token.then(function(data) {
            // Send Response
            res.send(200, {
                0: 'OK'
            });
        }).done();
    } else {
        token.then(function(data) {
            // Send Response
            next();
        }).done();
    }
};

var getDataAndRespondC = function(req, res, func, funcMeta) {
    // Get the saved token for this user
    var token = getToken(req, res);
    token.then(function(obj) {
        // Run the passed in function
        var data = func(req, obj);
        return data;
    })
        .then(function(data) {
            if (!funcMeta)
                return data;
            funcMeta(req, token, data);
            return data;
        })
        .then(function(data) {
            // Send Response
            res.send(200, data);
        }).done();
};

var protoListFunc = function(fifoItem, obj, token, allItems) {
    // List all Items
    return getEndpointData(function(obj) {
        if (!allItems) {
            // List all items, uuid only
            return fifoItem.list(obj);
        } else {
            // List all items, all data
            return fifoItem.listAll(obj);
        }
    }, token);
},
    protoListDetailFunc = function(fifoItem, e, obj, token) {
        return getEndpointData(function(obj) {
            // Get the specific item
            return fifoItem.get(e, obj);
        }, token);
    },
    listDcFunc = function(obj, token, allItems) {
        return protoListFunc(Datacenter, obj, token, allItems);
    },
    listDcDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Datacenter, e, obj, token);
    },
    listVmFunc = function(obj, token, allItems) {
        return protoListFunc(VM, obj, token, allItems);
    },
    listVmDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(VM, e, obj, token);
    },
    listNetworkFunc = function(obj, token, allItems) {
        return protoListFunc(Network, obj, token, allItems);
    },
    listNetworkDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Network, e, obj, token);
    },
    listPackageFunc = function(obj, token, allItems) {
        return protoListFunc(Package, obj, token, allItems);
    },
    listPackageDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Package, e, obj, token);
    },
    listDatasetFunc = function(obj, token, allItems) {
        return protoListFunc(Dataset, obj, token, allItems);
    },
    listDatasetDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Dataset, e, obj, token);
    },
    listUserFunc = function(obj, token, allItems) {
        return protoListFunc(User, obj, token, allItems);
    },
    listUserDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(User, e, obj, token);
    },
    listRoleFunc = function(obj, token, allItems) {
        return protoListFunc(Role, obj, token, allItems);
    },
    listRoleDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Role, e, obj, token);
    },
    listOrganizationFunc = function(obj, token, allItems) {
        return protoListFunc(Organization, obj, token, allItems);
    },
    listOrganizationDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Organization, e, obj, token);
    },
    listDtraceFunc = function(obj, token, allItems) {
        return protoListFunc(Dtrace, obj, token, allItems);
    },
    listDtraceDetailFunc = function(e, obj, token) {
        return protoListDetailFunc(Dtrace, e, obj, token);
    };

var getCombinedCloudData = function(req, res, runMatrix, dfdAddin, dfdFinal) {
    var asynci = 0,
        asyncMax = Config.FiFo.length,
        packedData = {},
        internalRunFn = function() {
            // console.log(req.session.token, typeof(req.session.token[asynci]));
            if ((!asynci in req.session.token) || (typeof(req.session.token[asynci]) !== 'string')) {
                // console.log('!');
                asynci++;
                if (asynci < asyncMax) {
                    internalRunFn();
                } else {
                    res.send(200, packedData);
                }
                return;
            }
            module.exports.whichFifo(asynci);
            var token = getToken(req, res);
            token.then(function() {
                var dfdCache = [];
                if (!dfdAddin) {
                    dfdAddin = function(theData) {
                        for (var key in theData) {
                            var subData = theData[key];
                            if (!(key in packedData))
                                packedData[key] = {
                                    list: [],
                                    ldata: {}
                                };
                            for (var j = 0; j < subData.list.length; j++) {
                                // make sure we don't add things in twice..
                                if (packedData[key].list.indexOf(subData.list[j]) === -1)
                                    packedData[key].list.push(subData.list[j]);
                            }
                            for (var jkey in subData.ldata)
                                packedData[key].ldata[jkey] = JSON.parse(JSON.stringify(subData.ldata[jkey]))
                        }
                        // console.log(packedData);
                    }
                }
                if (!dfdFinal) {
                    dfdFinal = function() {
                        // module.exports.whichFifoLoggedIn(req, res);
                        res.send(200, packedData);
                    }
                }
                for (var i = 0; i < runMatrix.length; i++) {
                    var tArray = runMatrix[i],
                        dfd = getEndpointDataWithChildren(tArray[0], tArray[1], tArray[2], token, asynci);
                    dfdCache.push(dfd);
                    dfd.then(dfdAddin);
                }
                Q.allSettled(dfdCache)
                    .done(function() {
                        asynci++;
                        if (asynci < asyncMax) {
                            internalRunFn();
                        } else {
                            dfdFinal();
                        }
                    });
            });
        };
    internalRunFn();
};

// listCloudDatacenterCount
module.exports.listCloudDatacenterCount = function(req, res) {
    setWhichDc(req);
    module.exports.whichFifoLoggedIn(req, res, function() {
        var token = getToken(req, res);
        token.then(function(obj) {
            // List all items, uuid and logged in status only
            var dfd = Datacenter.list(obj);
            dfd.then(function(dcList) {
                var dcListToSend = JSON.parse(JSON.stringify(dcList));
                for (var key in dcListToSend) {
                    var loggedIn = (_token[key] !== '{}');
                    dcListToSend[key] = {
                        name: dcListToSend[key],
                        loggedIn: loggedIn
                    }
                }
                res.send(200, dcListToSend);
            });
        });
    });
};

// listCloudOverviewData
module.exports.listCloudOverviewData = function(req, res) {
    var runMatrix = [
        ['dcs', listDcFunc, listDcDetailFunc],
        // ['dtraces', listDtraceFunc, listDtraceDetailFunc],
        ['vms', listVmFunc, listVmDetailFunc],
        ['packages', listPackageFunc, listPackageDetailFunc],
        ['datasets', listDatasetFunc, listDatasetDetailFunc]
    ];
    getCombinedCloudData(req, res, runMatrix);
};

// listCloudDetailData
module.exports.listCloudDetailData = function(req, res) {
    var runMatrix = [
        ['dcs', listDcFunc, listDcDetailFunc],
        // ['dtraces', listDtraceFunc, listDtraceDetailFunc],
        ['vms', listVmFunc, listVmDetailFunc],
        ['packages', listPackageFunc, listPackageDetailFunc],
        ['datasets', listDatasetFunc, listDatasetDetailFunc]
    ];
    getCombinedCloudData(req, res, runMatrix);
};

// listMachineData
module.exports.listMachineData = function(req, res) {
    var runMatrix = [
        ['dcs', listDcFunc, listDcDetailFunc],
        // ['dtraces', listDtraceFunc, listDtraceDetailFunc],
        ['vms', listVmFunc, listVmDetailFunc],
        ['packages', listPackageFunc, listPackageDetailFunc],
        ['datasets', listDatasetFunc, listDatasetDetailFunc]
    ];
    getCombinedCloudData(req, res, runMatrix);
};

// listUserViewsData
module.exports.listUserViewsData = function(req, res) {
    var runMatrix = [
        ['dcs', listDcFunc, listDcDetailFunc],
        // ['dtraces', listDtraceFunc, listDtraceDetailFunc],
        ['users', listUserFunc, listUserDetailFunc],
        ['roles', listRoleFunc, listRoleDetailFunc],
        ['organizations', listOrganizationFunc, listOrganizationDetailFunc]
    ];
    getCombinedCloudData(req, res, runMatrix);
};

// listOrgViewData
module.exports.listOrgViewData = function(req, res) {
    var runMatrix = [
        ['dcs', listDcFunc, listDcDetailFunc],
        // ['dtraces', listDtraceFunc, listDtraceDetailFunc],
        ['vms', listVmFunc, listVmDetailFunc],
        ['packages', listPackageFunc, listPackageDetailFunc],
        ['datasets', listDatasetFunc, listDatasetDetailFunc],
        ['users', listUserFunc, listUserDetailFunc],
        ['roles', listRoleFunc, listRoleDetailFunc],
        ['organizations', listOrganizationFunc, listOrganizationDetailFunc]
    ];
    getCombinedCloudData(req, res, runMatrix);
};

// USERS
// =====

// List
module.exports.listUsers = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Users
        return User.list(obj);
    });
};

// CreateUser
module.exports.createUser = function(req, res) {
    setWhichDc(req);
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Temp Pwd
        var code = Math.floor(Math.random() * 40).toString() + ":" + new Date().getTime().toString();
        code = crypto.createHash("md5").update(code).digest("hex");
        // code = code.substr(0, 6) + new Buffer(code).toString('base64').substr(0, 6);
        // Create User
        return User.create(req.body.username, code, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "email": req.body.email,
            "name": {
                "first": req.body.first_name,
                "last": req.body.last_name
            },
            "title": req.body.title
        };
        // Set Metadata
        token.then(function(obj) {
            User.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Forgot Password
module.exports.forgotPassword = function(req, res, next) {

    console.log('Forgot Password');

    // Create Code
    var code = Math.floor(Math.random() * 40).toString() + ":" + new Date().getTime().toString();
    code = crypto.createHash("md5").update(code).digest("hex");
    // code = code.substr(0, 6) + new Buffer(code).toString('base64').substr(0, 6);
    req.session.code = code;

    // Create token with admin user
    var userFound = false,
        userUuid = '',
        userName = '',
        token = FiFo.connect(Config.FiFo[_which].url, Config.FiFo[_which].username, Config.FiFo[_which].password);

    token.then(function(obj) {
        // Save code to FiFo user record
        var dfd = getEndpointDataWithChildren('users', listUserFunc, listUserDetailFunc, token);
        dfd.then(function(data) {
            for (var key in data.users.ldata) {
                var metadata = data.users.ldata[key].metadata;
                if (('lucera3' in metadata) && ('email' in metadata.lucera3)) {
                    // console.log(req.body.email, metadata.lucera3.email);
                    if (req.body.email === metadata.lucera3.email) {
                        console.log('match found, saving code to account!');
                        userFound = true;
                        userUuid = key;
                        userName = metadata.lucera3.name.first;
                        break;
                    }
                }
            }
            return data;
        })
            .done(function() {
                if (userFound) {
                    if (!('session' in req))
                        req.session = {};
                    req.session.name = userName;
                    User.metadataSet(userUuid, ["lucera3", "pwdCode"], req.session.code, obj);
                    // res.send(200, {0:'OK'});
                    next();
                } else {
                    res.send(403, {
                        0: 'No such user'
                    });
                }
            });
    });
};

module.exports.savePassMetadata = function(req, res, next) {
    console.log('Saving password to user metadata.');

    var userFound = false,
        dataFailed = false,
        userUuid = '',
        userName = '',
        userData = {},
        token = FiFo.connect(Config.FiFo[_which].url, Config.FiFo[_which].username, Config.FiFo[_which].password, true);

    token.then(function(obj) {
        var dfd = getEndpointDataWithChildren('users', listUserFunc, listUserDetailFunc, token);
        dfd.then(function(data) {
            // if we didn't get any data, let's try again..
            if (!data || !('users' in data) || !('ldata' in data.users)) {
                dataFailed = true;
                module.exports.savePassMetadata(req, res, next);
                return;
            }
            for (var key in data.users.ldata) {
                var metadata = data.users.ldata[key].metadata;
                if (('lucera3' in metadata) && ('email' in metadata.lucera3)) {
                    // console.log(req.body.email, metadata.lucera3.email);
                    if (req.body.email === metadata.lucera3.email) {
                        console.log('match found, saving code to account!');
                        userFound = true;
                        userUuid = key;
                        req.body.userUuid = userUuid;
                        req.body.orgUuid = data.users.ldata[key].org;
                        userName = metadata.lucera3.name.first;
                        userData = data.users.ldata[key];
                        break;
                    }
                }
            }
            return data;
        })
            .done(function() {
                if (!dataFailed) {
                    if (userFound) {
                        if (!('session' in req))
                            req.session = {};
                        req.session.name = userName;
                        req.session.user = userData;
                        User.metadataSet(userUuid, ["lucera3", "genPass"], req.body.password, obj);
                        // res.send(200, {0:'OK'});
                        next();
                    } else {
                        res.send(403, {
                            0: 'No such user'
                        });
                    }
                }
            });
    });
}

// Reset Password
module.exports.resetPassword = function(req, res, next) {

    console.log('Reset Password');

    // Parse code from hash
    var code = req.session && req.session.code ? req.session.code : 'NO CODE FOUND';
    console.log(code);
    req.session.destroy();

    // Create token with admin user
    var userFound = false,
        userUuid = '',
        token = FiFo.connect(Config.FiFo[_which].url, Config.FiFo[_which].username, Config.FiFo[_which].password);

    token.then(function(obj) {
        // Save password to FiFo user record
        var dfd = getEndpointDataWithChildren('users', listUserFunc, listUserDetailFunc, token);
        dfd.then(function(data) {
            for (var key in data.users.ldata) {
                var metadata = data.users.ldata[key].metadata;
                if (('lucera3' in metadata) && ('pwdCode' in metadata.lucera3)) {
                    console.log(code, metadata.lucera3.pwdCode);
                    if (code === metadata.lucera3.pwdCode) {
                        console.log('match found, saving changed password to account!');
                        userFound = true;
                        userUuid = key;
                        break;
                    }
                }
            }
            return data;
        })
            .done(function() {
                if (userFound) {
                    User.passwd(userUuid, req.body.password, obj);
                    User.metadataDel(userUuid, ["lucera3", "pwdCode"], obj);
                    User.metadataDel(userUuid, ["lucera3", "genPass"], obj);
                    res.send(200, {
                        0: 'OK'
                    });
                } else {
                    res.send(403, {
                        0: 'No user found!'
                    });
                }
            });
    });
};

// InjectZendesk
module.exports.injectZendesk = function(req, res, next) {
    var zdId = req.body.zdId,
        email = req.body.email,
        uuid = req.body.uuid;

    // Make sure we have an Id here
    console.log('Inject Zendesk Id', zdId, email, uuid);
    if (!zdId || (zdId === '')) {
        res.send(403, {
            0: 'No zendeskId specified.'
        });
        return;
    }

    // Create token with admin user
    // var userFound = false,
    //     userUuid = '';
    token = FiFo.connect(Config.FiFo[_which].url, Config.FiFo[_which].username, Config.FiFo[_which].password, true);

    token.then(function(obj) {
        // // Save zendesk Id to FiFo user record
        // var dfd = getEndpointDataWithChildren('users', listUserFunc, listUserDetailFunc, token);
        // dfd.then(function(data) {
        //     if ('users' in data) {
        //         if ('ldata' in data.users) {
        //             for (var key in data.users.ldata) {
        //                 var metadata = data.users.ldata[key].metadata;
        //                 if (('lucera3' in metadata) && ('email' in metadata.lucera3)) {
        //                     // console.log(email, metadata.lucera3.email);
        //                     if (email === metadata.lucera3.email) {
        //                         console.log('match found [' + key + '], saving zendesk Id to account!');
        //                         userFound = true;
        //                         userUuid = key;
        //                         break;
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     return data;
        // })
        //     .done(function() {
        //         var token = getToken(req, res);
        //         token.then(function() {
        // if (userFound) {
        req.session.user.metadata.lucera3.zendeskId = zdId;
        User.metadataSet(uuid, ["lucera3", "zendeskId"], zdId, obj);
        next();
        //         } else {
        //             res.send(403, {
        //                 0: 'No such user'
        //             });
        //         }
        //     });
        // });
    });
};

// Get
module.exports.getUser = function(req, res) {
    setWhichDc(req);
    module.exports.whichFifoLoggedIn(req, res, function() {
        getDataAndRespondA(req, res, function(req, obj) {
            // Get User
            return User.get(req.body.uuid, obj);
        });
    });
};

// Special case - get the logged in user
module.exports.getCurrentUser = function(req, res) {
    setWhichDc(req);
    // console.log('Session-saved user info:', _which, req.session._loggedInFifo, req.session._uuid, req.session.user);
    if (!req.session._uuid)
        res.send(200, req.session);
    else {
        // console.log('Getting the current info...');
        var deferred = Q.defer(),
            userDfd = null,
            orgDfd = null;

        module.exports.whichFifoLoggedIn(req, res, function() {
            getDataAndRespondA(req, res, function(req, obj) {
                // Get User
                // console.log('Retrieved user info:', _which, req.session._loggedInFifo, req.session._uuid, obj);
                userDfd = User.get(req.session._uuid, obj);
                userDfd.then(function(userData) {

                    var token = getToken(req, res);
                    token.then(function(obj) {
                        // Get Organization
                        orgDfd = Organization.get(userData.org, obj);
                        orgDfd.then(function(orgData) {
                            userData.origOrg = orgData;
                            deferred.resolve(userData);
                        });
                    });

                });
                return deferred.promise;
            });
        });
    }
};

// Change Password
module.exports.changePassword = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Change to the new password
            User.passwd(req.body.uuid, req.body.new_password, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
};

// Delete
module.exports.deleteUser = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete User
        User.del(req.body.uuid, obj);
    });
};

// List User Permissions
module.exports.listUserPerms = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all User Permissions
        return User.listPerms(req.body.uuid, obj);
    });
};

// Grant User Permission
module.exports.grantUserPerm = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Grant the new Permission
        User.grant(req.body.uuid, req.body.permission, obj);
    });
};

// Revoke User Permission
module.exports.revokeUserPerm = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Revoke the new Permission
        User.revoke(req.body.uuid, req.body.permission, obj);
    });
};

// List User Roles
module.exports.listUserRoles = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all User Roles
        return User.listRoles(req.body.uuid, obj);
    });
};

// Join Role
module.exports.addUserRole = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Add a User to a Role
            User.joinRole(req.body.uuid, req.body.role_uuid, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
};

// Leave Role
module.exports.delUserRole = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Remove a User from a Role
        User.leaveRole(req.body.uuid, req.body.role_uuid, obj);
    });
};

// List User Keys
module.exports.listUserKeys = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all User Keys
        return User.listKeys(req.body.uuid, obj);
    });
};

// Add User Key
module.exports.addUserKey = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Add a Key for a User
            User.addKey(req.body.uuid, req.body.key_id, req.body.key_data, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
};

// Delete User Key
module.exports.delUserKey = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Delete a Key for a User
            User.deleteKey(req.body.uuid, req.body.key_id, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
};

// List YubiKeys
module.exports.listYubiKeys = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all YubiKeys
        return User.listYubiKeys(req.body.uuid, obj);
    });
};

// Add YubiKey
module.exports.addYubiKey = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Add a YubiKey for a User
            User.addYubikey(req.body.uuid, req.body.key_data, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
};

// Delete YubiKey
module.exports.delYubiKey = function(req, res, next) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        var dfd = User.get(req.body.uuid, obj);
        dfd.then(function(userData) {
            // Delete a YubiKey for a User
            User.deleteYubikey(req.body.uuid, req.body.key_id, obj);
            // Setup the email address of this user for the mailer
            if (userData && ('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                req.body.name = userData.metadata.lucera3.name.first;
                req.body.email = userData.metadata.lucera3.email;
            }
            next();
        });
    }, function() {});
};

// List User Orgs
module.exports.listUserOrgs = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all User Organizations
        return User.listOrgs(req.body.uuid, obj);
    });
};

// Join Org
module.exports.addUserOrg = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Add a User to an Organization
        User.joinOrg(req.body.uuid, req.body.org_uuid, obj);
    });
};

// Active Org -- uses same call as Join Org, but has its own api endpoint
module.exports.activateUserOrg = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Add a User to an Organization and activate it
        User.activeOrg(req.body.uuid, req.body.org_uuid, obj);
    });
};

// Leave Org -- not present in API documentation?
module.exports.delUserOrg = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Remove a User from an Organization
        User.leaveOrg(req.body.uuid, req.body.org_uuid, obj);
    });
};

// User Metadata Set - Shallow
module.exports.metadataUserSetAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "email": req.body.email,
            "name": {
                "first": req.body.first_name,
                "last": req.body.last_name
            },
            "title": req.body.title
        };
        // Set Metadata
        User.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// User Metadata Delete - Shallow
module.exports.metadataUserDelAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        User.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// User Metadata Set - Deep
module.exports.metadataUserSet = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        User.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// User Metadata Delete - Deep
module.exports.metadataUserDel = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        User.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// ROLES
// =====

// List
module.exports.listRoles = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Roles
        return Role.list(obj);
    });
};

// Create
module.exports.createRole = function(req, res) {
    setWhichDc(req);
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Role
        return Role.create(req.body.roleName, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "description": req.body.description,
            "roleName": req.body.roleName,
            "adminRole": req.body.adminRole || ''
        };
        // Set Metadata
        token.then(function(obj) {
            Role.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getRole = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Role
        return Role.get(req.body.uuid, obj);
    });
};

// Delete
module.exports.deleteRole = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Role
        Role.del(req.body.uuid, obj);
    });
};

// List Role Permissions
module.exports.listRolePerms = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Role Permissions
        return Role.listPerms(req.body.uuid, obj);
    });
};

// Grant Role Permission
module.exports.grantRolePerm = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Grant the new Permission
        Role.grant(req.body.uuid, req.body.permission, obj);
    });
};

// Revoke Role Permission
module.exports.revokeRolePerm = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Revoke the new Permission
        Role.revoke(req.body.uuid, req.body.permission, obj);
    });
};

// Role Metadata Set - Shallow
module.exports.metadataRoleSetAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        Role.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Role Metadata Delete - Shallow
module.exports.metadataRoleDelAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Role.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Role Metadata Set - Deep
module.exports.metadataRoleSet = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Role.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Role Metadata Delete - Deep
module.exports.metadataRoleDel = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Role.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// ORGANIZATIONS
// =============

// List
module.exports.listOrganizations = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Organizations
        return Organization.list(obj);
    });
};

// Create
module.exports.createOrganization = function(req, res) {
    setWhichDc(req);
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Organization
        return Organization.create(req.body.orgName, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "company": req.body.orgName,
            "phone": req.body.phone,
            "billing_email": req.body.billing_email,
            "address": {
                "street": req.body.street,
                "city": req.body.city,
                "state": req.body.state,
                "zip": req.body.zip
            },
            "companyName": req.body.orgName
        };
        // Set Org Meta
        token.then(function(obj) {
            Organization.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getOrganization = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Organization
        return Organization.get(req.body.uuid, obj);
    });
};

// Delete
module.exports.deleteOrganization = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Organization
        Organization.del(req.body.uuid, obj);
    });
};

// List Organization Triggers
module.exports.listOrganizationTriggers = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Triggers for an Organization
        return Organization.listTriggers(req.body.uuid, obj);
    });
};

// Add Organization Trigger
module.exports.addOrganizationTrigger = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Permission Payload Object
        var permissionPayload = {
            "action": "role_grant",
            "base": "vms",
            "trigger": "vm_create",
            "permission": [
                req.body.permission
            ],
            "target": req.body.role_uuid
        };
        // console.log(req.body.uuid, req.body.permission_role, permissionPayload);
        // Add a new Trigger to an Organization
        Organization.addTrigger(req.body.uuid, req.body.permission_role, permissionPayload, obj);
    });
};

// Remove Organization Trigger ( still broken: until node.js supports DELETE body data )
module.exports.delOrganizationTrigger = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Permission Payload Object
        var permissionPayload = {
            "action": "role_grant",
            "base": "vms",
            //"trigger": "vm_create",
            "permission": [
                req.body.permission
            ],
            "target": req.body.role_uuid
        };
        // Delete the Trigger
        Organization.removeTrigger(req.body.uuid, req.body.permission_role, permissionPayload, obj);
    });
};

// Organization Metadata Set - Shallow
module.exports.metadataOrganizationSetAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "company": req.body.orgName,
            "phone": req.body.phone,
            "billing_email": req.body.billing_email,
            "address": {
                "street": req.body.street,
                "city": req.body.city,
                "state": req.body.state,
                "zip": req.body.zip
            }
        };
        // Set Metadata
        Organization.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Organization Metadata Delete - Shallow
module.exports.metadataOrganizationDelAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Organization.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Organization Metadata Set - Deep
module.exports.metadataOrganizationSet = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Organization.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Organization Metadata Delete - Deep
module.exports.metadataOrganizationDel = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Organization.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// HYPERVISORS
// ===========

// List
module.exports.listHypervisors = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Hypervisors
        return Hypervisor.list(obj);
    });
};

// Get
module.exports.getHypervisor = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Hypervisor
        return Hypervisor.get(req.body.uuid, obj);
    });
};

// Alias
module.exports.aliasHypervisor = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Alias the Hypervisor
        return Hypervisor.alias(req.body.uuid, req.body.alias, obj);
    });
};

// Hypervisor Metadata Set - Shallow
module.exports.metadataHypervisorSetAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        Hypervisor.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Hypervisor Metadata Delete - Shallow
module.exports.metadataHypervisorDelAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Hypervisor.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Hypervisor Metadata Set - Deep
module.exports.metadataHypervisorSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Hypervisor.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Hypervisor Metadata Delete - Deep
module.exports.metadataHypervisorDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Hypervisor.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// Characteristic set
module.exports.characteristicHypervisorSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Characteristic
        Hypervisor.characteristicSet(req.body.uuid, req.body.characteristic_key, req.body.characteristic_value, obj);
    });
};

// Characteristic delete
module.exports.characteristicHypervisorDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Characteristic
        Hypervisor.characteristicDel(req.body.uuid, req.body.characteristic_key, obj);
    });
};

// VMS
// ===

// List
module.exports.listVMs = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all VMS
        return VM.list(obj);
    });
};

// Create
module.exports.createVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondC(req, res, function(req, obj) {
        // Create VM
        return VM.create(req.body.dataset_uuid, req.body.package_uuid, req.body.config, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        token.then(function(obj) {
            VM.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

var prereqQuickCreate = function(req, role, func, token) {
    var deferred = Q.defer()
    uuid = '';
    if (!(role in req.body)) {
        deferred.resolve(uuid);
    } else {
        var bRole = req.body[role];
        if ('uuid' in bRole) {
            uuid = bRole.uuid;
            deferred.resolve(uuid);
        } else {
            var reqBody = JSON.parse(JSON.stringify(bRole));
            func(reqBody, token)
                .then(function(result) {
                    deferred.resolve(result);
                });
        }
    }
    return deferred.promise;
};

// CreateVMbyObj
module.exports.createVMbyObj = function(req, res, next) {
    var bodyOrig = JSON.parse(JSON.stringify(req.body)),
        savedRes = res;

    console.log(bodyOrig);
    if (!req.body.dataset || !req.body.package || !req.body.config || !req.body.config.networks || !req.body.config.networks.net0) {
        savedRes.send(new Error('No data found to create this MI!'));
    }

    setWhichDc(req);
    var token = getToken(req, res);
    token.then(function(obj) {
        // setup the functions to support the utility function below
        var orgFunc = function(uuid, token) {
            var deferred = Q.defer();
            token.then(function(obj) {
                // console.log('getting organization name');
                return Organization.get(uuid, obj);
            })
                .then(function(orgInfo) {
                    deferred.resolve(orgInfo.name);
                });
            return deferred.promise;
        },
            netFunc = function(coName, token) {
                var deferred = Q.defer();
                token.then(function(obj) {
                    // console.log('finding company network');
                    return Network.listAll(obj);
                })
                    .then(function(networks) {
                        // console.log('networks found:', networks);
                        for (var i = 0; i < networks.length; i++) {
                            if (coName === networks[i].name.substr(0, coName.length)) {
                                deferred.resolve(networks[i].uuid);
                                break;
                            }
                        }
                        deferred.reject();
                    });
                return deferred.promise;
            },
            packageFunc = function(hardware, token) {
                var deferred = Q.defer();
                token.then(function(obj) {
                    // console.log('finding package');
                    return Package.listAll(obj);
                })
                    .then(function(packages) {
                        // console.log('packages found:', packages);
                        var packageTarget = hardware + ' Cores';
                        for (var i = 0; i < packages.length; i++) {
                            if (packageTarget === packages[i].name.substr(0, packageTarget.length)) {
                                deferred.resolve(packages[i].uuid);
                                break;
                            }
                        }
                        deferred.reject();
                    });
                return deferred.promise;
            },
            datasetFunc = function(os, token) {
                var deferred = Q.defer();
                token.then(function(obj) {
                    // console.log('finding dataset');
                    return Dataset.listAll(obj);
                })
                    .then(function(datasets) {
                        // console.log('datasets found:', datasets);
                        var j,
                            osTarget = os.toLowerCase(),
                            resultDatasets = {},
                            versionTrack = [0, 0, 0],
                            itemFound = false;
                        if (osTarget === 'centos')
                            osTarget = 'linux';
                        // console.log(osTarget);
                        for (var i = 0; i < datasets.length; i++) {
                            var dataset = datasets[i],
                                version = dataset.version,
                                verArray = version.split(/[.]/);
                            // console.log(osTarget, dataset.os);
                            if ((osTarget === dataset.os) && ((osTarget !== 'smartos') || (dataset.name === 'base64'))) {
                                // console.log('checking...');
                                var direction = [0, 0, 0];
                                for (j = 0; j < verArray.length; j++) {
                                    var checkNew = parseInt(verArray[j], 10),
                                        checkOld = parseInt(versionTrack[j], 10);
                                    if (checkNew > checkOld) {
                                        direction[j] = 1;
                                    } else if (checkNew < checkOld) {
                                        direction[j] = -1;
                                    }
                                }
                                // console.log(version, verArray, direction.join());
                                switch (direction.join()) {
                                    case '1,1,1':
                                    case '1,1,0':
                                    case '1,0,1':
                                    case '1,0,0':
                                    case '0,1,1':
                                    case '0,1,0':
                                    case '0,0,1':
                                        // console.log(version + ' is higher than ' + versionTrack.join('.'));
                                        versionTrack = verArray;
                                        itemFound = true;
                                        break;

                                }
                                resultDatasets[dataset.version] = dataset;
                            }
                        }
                        if (itemFound)
                            deferred.resolve(resultDatasets[versionTrack.join('.')].dataset);
                        else
                            deferred.reject();
                    });
                return deferred.promise;
            },
            vmFunc = function(reqBody, token) {
                var deferred = Q.defer();
                token.then(function(obj) {
                    // console.log('creating vm');
                    return VM.create(reqBody.dataset_uuid, reqBody.package_uuid, reqBody.config, obj);
                })
                    .then(function(vm) {
                        var meta = {
                            "description": reqBody.description
                        };
                        token.then(function(obj) {
                            VM.metadataSet(vm.uuid, "lucera3", meta, obj);
                        });
                        // console.log('resolving vm uuid: ' + vm.uuid);
                        deferred.resolve(vm.uuid);
                    });
                return deferred.promise;
            };
        var networkUuid, packageUuid, datasetUuid;
        var dfdCache = [];

        var packageDfd = packageFunc(req.body.package_hint, token);
        dfdCache.push(packageDfd);
        packageDfd.then(function(data) {
            packageUuid = data;
            // console.log('package uuid received as: ' + data);
        });

        var datasetDfd = datasetFunc(req.body.dataset_hint, token);
        dfdCache.push(datasetDfd);
        datasetDfd.then(function(data) {
            datasetUuid = data;
            // console.log('dataset uuid received as: ' + data);
        });

        var orgDfd = orgFunc(req.session.user.org, token);
        orgDfd.then(function(orgName) {

            var networkDfd = netFunc(orgName, token);
            dfdCache.push(networkDfd);
            networkDfd.then(function(data) {
                networkUuid = data;
                // console.log('network uuid received as: ' + data);

                // And create the VM
                Q.allSettled(dfdCache)
                    .done(Q.delay(500).then(function() {
                        // Create VM
                        var vmBody = req.body['vm'],
                            errorFunc = function(err) {
                                // console.log('vm creation error!');
                                // console.log(err);
                                savedRes.send(err);
                            };
                        vmBody.config.networks = {
                            "net0": networkUuid
                        };
                        vmBody.package_uuid = packageUuid;
                        vmBody.dataset_uuid = datasetUuid;
                        // console.log(req.body);
                        if (!datasetUuid) {
                            errorFunc('No dataset uuid found!');
                        } else {
                            var vmDfd = prereqQuickCreate(req, 'vm', vmFunc, token);
                            vmDfd.then(function(vmUuid) {
                                console.log('vm created! ' + vmUuid);
                                if (vmUuid && vmUuid.length > 5) {
                                    req.body.vmCreated = vmUuid;
                                    // Setup the email address of this user for the mailer
                                    var userData = ('session' in req) && ('user' in req.session) ? req.session.user : {};
                                    if (('metadata' in userData) && ('lucera3' in userData.metadata) && ('email' in userData.metadata.lucera3)) {
                                        req.body.name = userData.metadata.lucera3.name.first;
                                        req.body.email = userData.metadata.lucera3.email;
                                        next();
                                    } else {
                                        savedRes.send({
                                            id: vmUuid
                                        });
                                    }
                                } else {
                                    errorFunc('No MI id found!');
                                }
                            }, errorFunc);
                        }
                    }));
            });

        });

    });
};

// Get
module.exports.getVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Get VM
        return VM.get(req.body.uuid, obj);
    });
};

// Action
module.exports.runActionVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Run a VM Action
        VM.action(req.body.uuid, req.body.action, obj);
    });
};

// Start
module.exports.runStartVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Run a VM Action
        VM.start(req.body.uuid, obj);
    });
};

// Stop
module.exports.runStopVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Run a VM Action
        VM.stop(req.body.uuid, obj);
    });
};

// Reboot
module.exports.runRebootVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Run a VM Action
        VM.reboot(req.body.uuid, obj);
    });
};

// Force stop
module.exports.runForceStopVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Run a VM Action
        VM.forceStop(req.body.uuid, obj);
    });
};

// Force reboot
module.exports.runForceRebootVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Run a VM Action
        VM.forceReboot(req.body.uuid, obj);
    });
};

// Update config
module.exports.updateConfigVM = function(req, res) {
    console.log(req.body, {
        config: req.body.config
    });
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Update this VM's config
        VM.update(req.body.uuid, {
            'config': req.body.config
        }, obj);
    });
};

// Update package
module.exports.updatePackageVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Update this VM's package
        VM.update(req.body.uuid, {
            'package': req.body.package
        }, obj);
    });
};

// Delete
module.exports.deleteVM = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete VM
        VM.del(req.body.uuid, obj);
    });
};

// Nic add
module.exports.addVMNic = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Add a NIC to a VM
        VM.nicAdd(req.body.uuid, req.body.nic_uuid, obj);
    });
};

// Nic make primary
module.exports.makeVMPrimaryNic = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Make a NIC the primary for a VM
        VM.nicMakePrimary(req.body.uuid, req.body.nic_mac, obj);
    });
};

// Nic delete
module.exports.deleteVMNic = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete a NIC from a VM
        VM.nicDel(req.body.uuid, req.body.nic_mac, obj);
    });
};

// Snapshots list
module.exports.listVMSnapshots = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all VM Snapshots
        return VM.snapshotsList(req.body.uuid, obj);
    });
};

// Snapshots create
module.exports.createVMSnapshot = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Create VM Snapshot
        return VM.snapshotsCreate(req.body.uuid, req.body.comment, obj);
    });
};

// Snapshots get
module.exports.getVMSnapshot = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Get a specific VM Snapshot
        return VM.snapshotsGet(req.body.uuid, req.body.snapshot_uuid, obj);
    });
};

// Snapshots rollback
module.exports.rollbackVMSnapshot = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Rollback a specific VM Snapshot
        VM.snapshotsRollback(req.body.uuid, req.body.snapshot_uuid, obj);
    });
};

// Snapshots delete
module.exports.deleteVMSnapshot = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete a specific VM Snapshot
        VM.snapshotsDel(req.body.uuid, req.body.snapshot_uuid, obj);
    });
};

// Backups list
module.exports.listVMBackups = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // List all VM Backups
        return VM.backupsList(req.body.uuid, obj);
    });
};

// Backups create
module.exports.createVMBackup = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Create VM Backup
        return VM.backupsCreate(req.body.uuid, req.body.comment, obj);
    });
};

// Backups get
module.exports.getVMBackup = function(req, res) {
    setWhichDc(req);
    getDataAndRespondA(req, res, function(req, obj) {
        // Get a specific VM Backup
        return VM.backupsGet(req.body.uuid, req.body.backup_uuid, obj);
    });
};

// Backups rollback
module.exports.rollbackVMBackup = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Rollback a specific VM Backup
        VM.backupsRollback(req.body.uuid, req.body.backup_uuid, obj);
    });
};

// Backups delete
module.exports.deleteVMBackup = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete a specific VM Backup
        VM.backupsDel(req.body.uuid, req.body.backup_uuid, obj);
    });
};

// Metadata set - Shallow
module.exports.metadataVMSetAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        VM.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Metadata delete - Shallow
module.exports.metadataVMDelAll = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        VM.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Metadata set - Deep
module.exports.metadataVMSet = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        VM.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Metadata delete - Deep
module.exports.metadataVMDel = function(req, res) {
    setWhichDc(req);
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        VM.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// NETWORKS
// ========

// List
module.exports.listNetworks = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Networks
        return Network.list(obj);
    });
};

// Create
module.exports.createNetwork = function(req, res) {
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Network
        return Network.create(req.body.networkName, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        token.then(function(obj) {
            Network.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getNetwork = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Network
        return Network.get(req.body.uuid, obj);
    });
};

// Delete
module.exports.deleteNetwork = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Network
        Network.del(req.body.uuid, obj);
    });
};

// Add iprange
module.exports.addNetworkIPrange = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Add an IPrange for a Network
        Network.addIprange(req.body.uuid, req.body.iprange_uuid, obj);
    });
};

// Delete iprange
module.exports.delNetworkIPrange = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete an IPrange for a Network
        Network.deleteIprange(req.body.uuid, req.body.iprange_uuid, obj);
    });
};

// Metadata set - Shallow
module.exports.metadataNetworkSetAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        Network.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Metadata delete - Shallow
module.exports.metadataNetworkDelAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Network.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Metadata set - Deep
module.exports.metadataNetworkSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Network.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Metadata delete - Deep
module.exports.metadataNetworkDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Network.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// IPRANGES
// ========

// List
module.exports.listIPranges = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all IPranges
        return IPrange.list(obj);
    });
};

// Create
module.exports.createIPrange = function(req, res) {
    getDataAndRespondC(req, res, function(req, obj) {
        // Create IPrange
        return IPrange.create(req.body.tag, req.body.iprangeName, req.body.network, req.body.gateway, req.body.netmask, req.body.first, req.body.last, req.body.vlan, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        token.then(function(obj) {
            IPrange.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getIPrange = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Get IPrange
        return IPrange.get(req.body.uuid, obj);
    });
};

// Delete
module.exports.deleteIPrange = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete IPrange
        IPrange.del(req.body.uuid, obj);
    });
};

// Optain an IP - *** not yet implemented in project-fifo ***
module.exports.obtainIP = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Obtain an IP
        return IPrange.obtainIp(req.body.uuid, obj);
    });
};

// Release an IP - *** not yet implemented in project-fifo ***
module.exports.releaseIP = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Release an IP
        IPrange.releaseIp(req.body.uuid, req.body.ip, obj);
    });
};

// Metadata set - Shallow
module.exports.metadataIPrangeSetAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        IPrange.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Metadata delete - Shallow
module.exports.metadataIPrangeDelAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        IPrange.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Metadata set - Deep
module.exports.metadataIPrangeSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        IPrange.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Metadata delete - Deep
module.exports.metadataIPrangeDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        IPrange.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// DATASETS
// ========

// List
module.exports.listDatasets = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Datasets
        return Dataset.list(obj);
    });
};

// Create
module.exports.createDataset = function(req, res) {
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Dataset
        return Dataset.create(req.body.datasetUrl, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "name": req.body.datasetName,
            "description": req.body.description
        };
        // Set Metadata
        token.then(function(obj) {
            Dataset.metadataSet(data.dataset, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getDataset = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Dataset
        return Dataset.get(req.body.uuid, obj);
    });
};

// Set some data
module.exports.setDatasetItem = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set the new key/value pair
        Dataset.set(req.body.uuid, req.body.key_name, req.body.key_value, obj);
    });
};

// Delete
module.exports.deleteDataset = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Dataset
        Dataset.del(req.body.uuid, obj);
    });
};

// Metadata set - Shallow
module.exports.metadataDatasetSetAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "name": req.body.datasetName,
            "description": req.body.description
        };
        // Set Metadata
        Dataset.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Metadata delete - Shallow
module.exports.metadataDatasetDelAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Dataset.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Metadata set - Deep
module.exports.metadataDatasetSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Dataset.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Metadata delete - Deep
module.exports.metadataDatasetDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Dataset.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// PACKAGES
// ========

// List
module.exports.listPackages = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Packages
        return Package.list(obj);
    });
};

// Create
module.exports.createPackage = function(req, res) {
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Package
        return Package.create(req.body.packageName, req.body.ram, req.body.quota, req.body.cpu_cap, req.body.requirements, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        token.then(function(obj) {
            Package.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getPackage = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Package
        return Package.get(req.body.uuid, obj);
    });
};

// Delete
module.exports.deletePackage = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Package
        Package.del(req.body.uuid, obj);
    });
};

// Metadata set - Shallow
module.exports.metadataPackageSetAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        Package.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Metadata delete - Shallow
module.exports.metadataPackageDelAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Package.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Metadata set - Deep
module.exports.metadataPackageSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Package.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Metadata delete - Deep
module.exports.metadataPackageDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Package.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};

// DTRACE
// ======

// List
module.exports.listDtraces = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // List all Dtraces
        return Dtrace.list(obj);
    });
};

// Create
module.exports.createDtrace = function(req, res) {
    getDataAndRespondC(req, res, function(req, obj) {
        // Create Dtrace
        return Dtrace.create(req.body.dtraceName, req.body.script, req.body.config, obj);
    }, function(req, token, data) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        token.then(function(obj) {
            Dtrace.metadataSet(data.uuid, "lucera3", meta, obj);
        });
        return data;
    });
};

// Get
module.exports.getDtrace = function(req, res) {
    getDataAndRespondA(req, res, function(req, obj) {
        // Get Dtrace
        return Dtrace.get(req.body.uuid, obj);
    });
};

// Delete
module.exports.deleteDtrace = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Dtrace
        Dtrace.del(req.body.uuid, obj);
    });
};

// Metadata set - Shallow
module.exports.metadataDtraceSetAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Create Meta Object
        var meta = {
            "description": req.body.description
        };
        // Set Metadata
        Dtrace.metadataSet(req.body.uuid, "lucera3", meta, obj);
    });
};

// Metadata delete - Shallow
module.exports.metadataDtraceDelAll = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Dtrace.metadataDel(req.body.uuid, "lucera3", obj);
    });
};

// Metadata set - Deep
module.exports.metadataDtraceSet = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Set Metadata
        Dtrace.metadataSet(req.body.uuid, req.body.meta_path, req.body.meta_data, obj);
    });
};

// Metadata delete - Deep
module.exports.metadataDtraceDel = function(req, res) {
    getDataAndRespondB(req, res, function(req, obj) {
        // Delete Metadata
        Dtrace.metadataDel(req.body.uuid, req.body.meta_path, obj);
    });
};