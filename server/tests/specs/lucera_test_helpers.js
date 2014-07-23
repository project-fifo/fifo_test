// DEPENDENCIES
// ============

var Config = require('../../config/config.js').config,
	request = require('superagent').agent(),
	expect = require('expect.js'),
	Q = require('../../../node_modules/q/q.js'),
	util = require('util');

// LTH DEFINITION
// =============

module.exports.lth = function() {
	var LTC = null;
	var my = {
		ltc: function(theLTC) {
			LTC = theLTC;
		},
		// Here are some utility functions to facilitate the API interactions
		getRequest: function() {
			return request;
		},
		loginUser: function() {
			return function(done) {
				console.log('Logging in as [' + LTC.username + ']...');
				request.post('localhost:3000/api/login').send({
					"username": LTC.username,
					"password": LTC.password
				}).end(function(res) {
					var resArray = my.confirmResultIsObjectAndParse(res);
					console.log(resArray);
					done();
					// return done();
				});
			}
		},

		showCountMessage: function(theCount, theTerm) {
			console.log(theCount + ' ' + theTerm + (theCount == 1 ? '' : 's') + ' found.');
		},

		confirmResultIsObject: function(res) {
			expect(res).to.exist;
			expect(res).to.be.an('object');
			expect(res.status).to.equal(200);
		},

		confirmResultIsObjectAndParse: function(res, minItems) {
			if (!minItems)
				minItems = 0;
			my.confirmResultIsObject(res);
			expect(res.text).to.exist;
			var resArray = JSON.parse(res.text);
			expect(resArray).to.be.an('object');
			expect(my.objectSize(resArray)).to.be.within(minItems, Infinity);
			return resArray;
		},

		listAllMembers: function(url1, url2, term) {
			var deferred = Q.defer();
			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				var savedCount = resText.length;
				my.showCountMessage(savedCount, term);
				if (resText.length == 0)
					deferred.resolve(savedCount);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						console.log(term + ' ' + (++iAsync) + ': ' + resArray.name + ' / ' + resArray.uuid);
						if (iAsync >= resText.length)
							deferred.resolve(savedCount);
					})
				}
			});
			return deferred.promise;
		},

		listAllMembersByDataset: function(url1, url2, term) {
			var deferred = Q.defer();
			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				var savedCount = resText.length;
				my.showCountMessage(savedCount, term);
				if (resText.length == 0)
					deferred.resolve(savedCount);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						console.log(term + ' ' + (++iAsync) + ': ' + resArray.name + ' / ' + resArray.dataset);
						if (iAsync >= resText.length)
							deferred.resolve(savedCount);
					})
				}
			});
			return deferred.promise;
		},

		listAllMembersByAlias: function(url1, url2, term) {
			var deferred = Q.defer();
			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				var savedCount = resText.length;
				my.showCountMessage(savedCount, term);
				if (resText.length == 0)
					deferred.resolve(savedCount);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						var theName = 'undefined';
						if (('config' in resArray) && ('alias' in resArray.config))
							theName = resArray.config.alias;
						else if ('alias' in resArray)
							theName = resArray.alias;
						console.log(term + ' ' + (++iAsync) + ': ' + theName + ' / ' + resArray.uuid);
						if (iAsync >= resText.length)
							deferred.resolve(savedCount);
					})
				}
			});
			return deferred.promise;
		},

		getSpecificMember: function(url1, url2, match, text) {
			var deferred = Q.defer();
			var savedUuid = '';
			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				if (resText.length == 0)
					deferred.resolve(savedUuid);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						if (resArray.name == match) {
							savedUuid = resArray.uuid;
							console.log(text + savedUuid);
							deferred.resolve(savedUuid);
						}
						++iAsync;
					})
				}
			});
			return deferred.promise;
		},

		getSpecificMemberByAlias: function(url1, url2, match, text) {
			var deferred = Q.defer();
			var savedUuid = '';
			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				if (resText.length == 0)
					deferred.resolve(savedUuid);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						if (resArray.config.alias == match) {
							savedUuid = resArray.uuid;
							console.log(text + savedUuid);
							deferred.resolve(savedUuid);
						}
						++iAsync;
					})
				}
			});
			return deferred.promise;
		},

		deleteAllMemberZendeskIds: function(url1, url2, url3, metadataPath, term, endDelay) {
			if (!endDelay)
				endDelay = 250;

			var deferred = Q.defer();

			request.post(url1)
				.send({}).end(function(res) {
					var resText = my.confirmResultIsObjectAndParse(res);
					var theCount = resText.length;
					if (theCount == 0)
						deferred.resolve();
					my.showCountMessage(theCount, term);
					var iAsync = 0;
					for (var i = 0; i < resText.length; i++) {
						var resUuid = resText[i];
						request.post(url2).send({
							"uuid": resUuid
						}).end(function(res2) {
							var resArray = my.confirmResultIsObjectAndParse(res2);
							var theName = resArray.name;
							var theUuid = resArray.uuid;
							console.log(term + ' ' + (++iAsync) + ': ' + theName + ' / ' + theUuid);
							var zendeskIdPresent = ('metadata' in resArray) && ('lucera3' in resArray.metadata) && ('zendeskId' in resArray.metadata.lucera3);

							if (!zendeskIdPresent) {
								console.log('No zendeskId found.');
							} else {
								console.log('Deleting zendesk ID..');
								request.post(url3).send({
									"uuid": theUuid,
									"meta_path": ["lucera3", "zendeskId"]
								}).end(function(res3) {
									my.confirmResultIsObject(res3);
								});
							}
							if (iAsync >= theCount)
								Q.delay(endDelay).then(function() {
									deferred.resolve();
								});
						});
					}
				});
			return deferred.promise;
		},

		deleteSpecificMember: function(url1, url2, url3, match, term, endDelay) {
			if (!endDelay)
				endDelay = 250;

			var deferred = Q.defer(),
				countDeleted = 0;

			request.post(url1)
				.send({}).end(function(res) {
					var resText = my.confirmResultIsObjectAndParse(res);
					var theCount = resText.length;
					if (theCount == 0)
						deferred.resolve(0);
					my.showCountMessage(theCount, term);
					var iAsync = 0;
					for (var i = 0; i < resText.length; i++) {
						var resUuid = resText[i];
						request.post(url2).send({
							"uuid": resUuid
						}).end(function(res2) {
							var resArray = my.confirmResultIsObjectAndParse(res2);
							var theName = resArray.name;
							var theUuid = resArray.uuid;
							console.log(term + ' ' + (++iAsync) + ': ' + theName + ' / ' + theUuid);
							var matchMade = false;
							var matchType = my.objectToType(match);
							if (matchType == 'string')
								matchMade = (theName == match);
							else if (matchType == 'array')
								matchMade = (match.indexOf(theName) > -1);
							else if (matchType == 'object') {
								var matchText = match.match,
									startsWith = 'startswith' in match,
									endsWith = 'endswith' in match
									regex = new RegExp((startsWith ? '^' : '') + matchText + (endsWith ? '$' : ''));
								if (matchText.length > 1)
									matchMade = regex.test(theName);
							}
							if (matchMade) {
								console.log('Deleting the ' + term + ' named:  [ ' + theName + ' ]');
								countDeleted++;
								request.post(url3).send({
									"uuid": theUuid
								}).end(function(res3) {
									my.confirmResultIsObject(res3);
									// deferred.resolve();
								});
							}
							if (iAsync >= theCount)
								Q.delay(endDelay).then(function() {
									deferred.resolve(countDeleted);
								});
						});
					}
				});
			return deferred.promise;
		},

		deleteSpecificMemberByDataset: function(url1, url2, url3, match, term, endDelay) {
			if (!endDelay)
				endDelay = 250;

			var deferred = Q.defer(),
				countDeleted = 0;

			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				var theCount = resText.length;
				if (theCount == 0)
					deferred.resolve(0);
				my.showCountMessage(theCount, term);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						var theName = resArray.name;
						var theUuid = resArray.dataset;
						console.log(term + ' ' + (++iAsync) + ': ' + theName + ' / ' + theUuid);
						if (match == theUuid) {
							console.log('Deleting the ' + term + ' named: ' + theName);
							countDeleted++;
							request.post(url3).send({
								"uuid": theUuid
							}).end(function(res3) {
								my.confirmResultIsObject(res3);
								// deferred.resolve();
							});
						}
						if (iAsync >= theCount)
							Q.delay(endDelay).then(function() {
								deferred.resolve(countDeleted);
							});
					});
				}
			});
			return deferred.promise;
		},

		deleteSpecificMemberByAlias: function(url1, url2, url3, match, term, endDelay) {
			if (!endDelay)
				endDelay = 250;

			var deferred = Q.defer(),
				countDeleted = 0;

			request.post(url1).send({}).end(function(res) {
				var resText = my.confirmResultIsObjectAndParse(res);
				var theCount = resText.length;
				if (theCount == 0)
					deferred.resolve(0);
				my.showCountMessage(theCount, term);
				var iAsync = 0;
				for (var i = 0; i < resText.length; i++) {
					var resUuid = resText[i];
					request.post(url2).send({
						"uuid": resUuid
					}).end(function(res2) {
						var resArray = my.confirmResultIsObjectAndParse(res2);
						var theName = ('config' in resArray) && ('alias' in resArray.config) ? resArray.config.alias : undefined;
						var theUuid = resArray.uuid;
						console.log(term + ' ' + (++iAsync) + ': ' + theName + ' / ' + theUuid);
						var matchMade = false;
						var matchType = my.objectToType(match);
						if (matchType == 'string')
							matchMade = (theName == match);
						else if (matchType == 'array')
							matchMade = (match.indexOf(theName) > -1);
						else if (matchType == 'object') {
							var matchText = match.match,
								startsWith = 'startswith' in match,
								endsWith = 'endswith' in match
								regex = new RegExp((startsWith ? '^' : '') + matchText + (endsWith ? '$' : ''));
							if (matchText.length > 1)
								matchMade = regex.test(theName);
						}
						if (matchMade) {
							console.log('Deleting the ' + term + ' named: ' + theName);
							countDeleted++;
							request.post(url3).send({
								"uuid": theUuid
							}).end(function(res3) {
								my.confirmResultIsObject(res3);
								// deferred.resolve();
							});
						}
						if (iAsync >= theCount)
							Q.delay(endDelay).then(function() {
								deferred.resolve(countDeleted);
							});
					});
				}
			});
			return deferred.promise;
		},

		objectSize: function(obj) {
			var size = 0,
				key;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) size++;
			}
			return size;
		},

		objectToType: function(obj) {
			return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
		},

		deepInspect: function(res) {
			console.log(util.inspect(res, true, 4, true));
		},

		// `condition` is a function that returns a boolean
		// `body` is a function that returns a promise
		// returns a promise for the completion of the loop
		promiseWhile: function(condition, body) {
			var done = Q.defer();

			function loop() {
				// When the result of calling `condition` is no longer true, we are
				// done.
				if (!condition()) return done.resolve();
				// Use `when`, in case `body` does not return a promise.
				// When it completes loop again otherwise, if it fails, reject the
				// done promise
				Q.when(body(), loop, done.reject);
			}

			// Start running the loop in the next tick so that this function is
			// completely async. It would be unexpected if `body` was called
			// synchronously the first time.
			Q.nextTick(loop);

			// The promise
			return done.promise;
		},

		waitForProperty: function(url, data, loopCallback, callback, loopDelay) {
			if (!loopDelay)
				loopDelay = 100;
			request.post(url).send(data)
				.end(function(res) {
					var resArray = my.confirmResultIsObjectAndParse(res);
					var condition = loopCallback(resArray);
					if (condition) {
						callback();
					} else {
						Q.delay(loopDelay).then(function() {
							my.waitForProperty(url, data, loopCallback, callback, loopDelay);
						});
					}
				});
		},

		waitForPropertyWithRetry: function(url1, url2, data, loopCallback, callback, loopDelay) {
			if (!loopDelay)
				loopDelay = 100;
			request.post(url1).send(data)
				.end(function(res) {
					var resArray = my.confirmResultIsObjectAndParse(res);
					var condition = loopCallback(resArray);
					if (condition) {
						callback();
					} else {
						request.post(url2).send(data)
							.end(function(res) {
								Q.delay(loopDelay).then(function() {
									my.waitForPropertyWithRetry(url1, url2, data, loopCallback, callback, loopDelay);
								});
							});
					}
				});
		},

		waitForListCount: function(url1, url2, name, loopCallback, callback, loopDelay, listFn) {
			if (!loopDelay)
				loopDelay = 100;
			if (!listFn)
				listFn = 'listAllMembers';
			my[listFn](url1, url2, name)
				.then(function(theCount) {
					var condition = loopCallback(theCount);
					if (condition) {
						callback();
					} else {
						Q.delay(loopDelay).then(function() {
							my.waitForListCount(url1, url2, name, loopCallback, callback, loopDelay, listFn);
						});
					}
				});
		},

		waitForListItem: function(url1, url2, match, saveText, loopCallback, callback, loopDelay, listFn) {
			if (!loopDelay)
				loopDelay = 100;
			if (!listFn)
				listFn = 'getSpecificMember';
			my[listFn](url1, url2, match, saveText)
				.then(function(theUuid) {
					var condition = loopCallback(theUuid);
					if (condition) {
						callback();
					} else {
						Q.delay(loopDelay).then(function() {
							my.waitForListItem(url1, url2, match, saveText, loopCallback, callback, loopDelay, listFn);
						});
					}
				});
		},

		waitForLoginChange: function(url1, url2, loginObject, loopCallback, callback, loopDelay) {
			if (!loopDelay)
				loopDelay = 100;
			request.get(url1).send({}).end(function(res) {
				request.post(url2).send(loginObject)
					.end(function(res) {
						var condition = loopCallback(res);
						if (condition) {
							callback();
						} else {
							Q.delay(loopDelay).then(function() {
								my.waitForLoginChange(url1, url2, loginObject, loopCallback, callback, loopDelay);
							});
						}
					});
			});
		},

		convertEmailArguments: function(which) {
			// console.log(which, LTC.test_mailMatrix[which]);
			var dataStruct = {
				emailName: which,
				email: LTC.test_email
			},
				emailVars = LTC.test_mailMatrix[which];
			for (var i = 0; i < emailVars.length; i++) {
				var theVar = emailVars[i];
				dataStruct[theVar] = LTC["test_" + theVar];
			}
			// console.log(dataStruct);
			return dataStruct;
		}

	}
	my.Config = Config;
	return my;
};