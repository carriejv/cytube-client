'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();
const io = require('socket.io');
const cytubeClient = require('../index.js');

const testOptions = {
	socketServer: 'http://localhost:3000',
	channel: 'test',
	reconnection: false
};

let server;

describe('cytube-client', function() {

	beforeEach(function(done) {
		server = io().listen(3000);
		done();
	});

	afterEach(function(done) {
		server.close();
		done();
	});

	describe('#connect()', function() {

		it('should not work with no arguments', function(done) {
			cytubeClient.connect().should.be.rejected.notify(done);
		});
		it('should resolve with valid settings', function(done) {
			cytubeClient.connect(testOptions).should.be.fulfilled.notify(done);
		});
		it('should disconnect if a password is required but not supplied', function(done) {
			server.on('connection', function(socket) {
				socket.on('joinChannel', function() {
					server.emit('needPassword');
				});
			})
			cytubeClient.connect(testOptions)
			.then(function(res) {
				res.on('disconnect', function() {
					done();
				});
			})
			.catch(function(err) {
				done(err);
			});
		});
		it('should attempt to authenticate if required and a password is provided', function(done) {
			server.on('connection', function(socket) {
				socket.on('joinChannel', function() {
					server.emit('needPassword');
				});
				socket.on('channelPassword', function() {
					done();
				})
			})
			let passOptions = Object.assign(testOptions);
			passOptions.password = 'password';
			cytubeClient.connect(passOptions)
			.catch(function(err) {
				done(err);
			});
		});
		it('should also work with a callback', function(done) {

			cytubeClient.connect(testOptions, (err, client) => {
				if(!err && client) {
					done();
				}
				else {
					done(err);
				}
			});
		});

	});

	describe('CytubeConnection', function() {

		describe('#getCurrentMedia()', function() {

			it('should return the value emitted on changeMedia', function(done) {
				server.on('connection', function(socket) {
					socket.on('joinChannel', function() {
						server.emit('changeMedia', 'Success!');
					});
				})
				cytubeClient.connect(testOptions)
				.then(function(res) {
					res.getCurrentMedia().should.eventually.equal('Success!').notify(done);
				})
				.catch(function(err) {
					done(err);
				});
			});

			it('should also work with a callback', function(done) {
				server.on('connection', function(socket) {
					socket.on('joinChannel', function() {
						server.emit('changeMedia', 'Success!');
					});
				})
				cytubeClient.connect(testOptions)
				.then(function(res) {
					res.getCurrentMedia( (err, data) => {
						if(!err && data === 'Success!') {
							done();
						}
						else {
							done(err);
						}
					});
				})
				.catch(function(err) {
					done(err);
				});
			});

		});

		describe('#getPlaylist()', function() {

			it('should return the value emitted on playlist', function(done) {
				server.on('connection', function(socket) {
					socket.on('joinChannel', function() {
						server.emit('playlist', 'Success!');
					});
				})
				cytubeClient.connect(testOptions)
				.then(function(res) {
					res.getPlaylist().should.eventually.equal('Success!').notify(done);
				})
				.catch(function(err) {
					done(err);
				});
			});

			it('should also work with a callback', function(done) {
				server.on('connection', function(socket) {
					socket.on('joinChannel', function() {
						server.emit('playlist', 'Success!');
					});
				})
				cytubeClient.connect(testOptions)
				.then(function(res) {
					res.getPlaylist( (err, data) => {
						if(!err && data === 'Success!') {
							done();
						}
						else {
							done(err);
						}
					});
				})
				.catch(function(err) {
					done(err);
				});
			});

		});

		describe('#getUserlist()', function() {

			it('should return the value emitted on userlist', function(done) {
				server.on('connection', function(socket) {
					socket.on('joinChannel', function() {
						server.emit('userlist', 'Success!');
					});
				})
				cytubeClient.connect(testOptions)
				.then(function(res) {
					res.getUserlist().should.eventually.equal('Success!').notify(done);
				})
				.catch(function(err) {
					done(err);
				});
			});

			it('should also work with a callback', function(done) {
				server.on('connection', function(socket) {
					socket.on('joinChannel', function() {
						server.emit('userlist', 'Success!');
					});
				})
				cytubeClient.connect(testOptions)
				.then(function(res) {
					res.getUserlist( (err, data) => {
						if(!err && data === 'Success!') {
							done();
						}
						else {
							done(err);
						}
					});
				})
				.catch(function(err) {
					done(err);
				});
			});

		});

	});

});