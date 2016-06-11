"use strict";
var unzip = require('unzip');
var fs = require('fs');
var request = require('request');
var probe = require('node-ffprobe');
var osuapi = require('osu-api');
var osu = new osuapi.Api('');
var numeral = require('numeral');
var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

var userObj = {
	faves: []
};

class Server {
	constructor (server, channelID) {
		this.channel = channelID;
		this.server = server;
		this.queue = [];
		this.elapsed_duration = 0;
		this.playing = false;
		this.currentSong;
	}
	
	isEmpty () {
		return Object.keys(bot.servers[this.server].channels[this.channel].members).length < 2;
	}
	
	getQueueDuration() {
		var total_duration = 0;
		for (var i = 0; i < this.queue.length; i++) {
			total_duration += this.queue[i].duration;
		}
		return total_duration;
	}
}


var deleteFolderRecursive = function(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file, index) {
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			}
			else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

request = request.defaults({
	jar: true
});
var music = db.music;

var stopped = false;
var currentSong;
var servers = {};
var mods = db.settings.mods;

bot.on('ready', function() {
	Object.keys(music.servers).forEach(function(key) {
		if (music.servers[key].channel && music.servers[key].autojoin) {
			if (bot.servers[key]) {
				join(music.servers[key].channel);
				if (Object.keys(bot.servers[key].channels[music.servers[key].channel].members).length > 1) {
					//play(music.servers[key].channel);
				}
			}
		}
		
	});
});

commands.on('join', function(user, userID, channelID, message) {
	var server = bot.serverFromChannel(channelID);
	var channels = bot.servers[server].channels;
	
	if (!servers[server]) {
		Object.keys(channels).forEach(function(key) {
			Object.keys(channels[key].members).forEach(function(userKey) {
				if (userKey === userID && channels[key].type == 'voice') {
					join(key);
				} else {
					bot.sentMessage({
						to:channelID,
						message:`Not in a voice channel`
					});
				}
			});
		});
	}
});

commands.on('play', function(user, userID, channelID, message) {
	play(channelID);
});

commands.on('stop', function(user, userID, channelID, message) {
	if (mods.indexOf(user) > -1) {
		stop(channelID);
	}
});

commands.on('queue', function(user, userID, channelID, message) {
	var cmd = message.split(" ")[0].toLowerCase();
	q(message, channelID, user, userID, cmd);
});

commands.on('skip', function(user, userID, channelID, message) {
	skip(user, channelID);
});

commands.on('leave', function(user, userID, channelID, message) {
	var server = bot.serverFromChannel(channelID);
	if (mods.indexOf(user) > -1) {
		if (servers[server]) {
			bot.leaveVoiceChannel(servers[server].channel);
			delete servers[server];
		}
	}
});

commands.on('clearqueue', function(user, userID, channelID, message) {
	clear(user);
});

commands.on('current', function(user, userID, channelID, message) {
	current(channelID);
});

commands.on('np', function(user, userID, channelID, message) {
	current(channelID);
});

commands.on('q', function(user, userID, channelID, message) {
	var cmd = message.split(" ")[0].toLowerCase();
	q(message, channelID, user, userID, cmd);
});

commands.on('getmap', function(user, userID, channelID, message) {
	var cmd = message.split(" ")[0].toLowerCase();
	getMap(message, channelID, user, userID, cmd);
});

commands.on('delsong', function(user, userID, channelID, message, args) {
	if (mods.indexOf(user) > -1) {
		if (args._[0]) {
			var index = music.songs.findIndex(function(ele) {
				return args._[0] === ele.id;
			});
			console.log(index);
			fs.stat(`./music/${music.songs[index].file}`, function(err, stat) {
				if (!err) {
					fs.unlink(`./music/${music.songs[index].file}`);
				}
			});
			music.songs.splice(index, 1);
		}
	}
});

commands.on('search', function(user, userID, channelID, message, args) {
	if (args._[0]) {
		var results = music.songs.filter(function(ele, index) {
			var searchRegex = new RegExp(args._[0], "i");
			if (searchRegex.test(ele.title)) return true;
			if (searchRegex.test(ele.artist)) return true;
		});
		var result_string = `Search results for ${args._[0]}\n`;
		for (var i=0; i < results.length; i++) {
			result_string += `${i + 1}. ${results[i].artist} - ${results[i].title} (${results[i].id})\n`;
		}
		if (results.length === 0) {
			result_string = `No results, check your spelling or do ${db.settings.prefix}getmap to download a song`;
		}
		bot.sendMessage({
			to: channelID,
			message: result_string
		});
		
		//console.log(JSON.stringify(results, null, 4));
		//callWatchers('music', 'songs');
	}
});

commands.on('fave', function(user, userID, channelID, message) {
	if (currentSong) {
		if (!music.users[userID]) {
			music.users[userID] = userObj;
		}
		music.users[userID].faves.push(currentSong.id);
		currentSong.faves++;
		bot.sendMessage({
			to:channelID,
			message: `<@${userID}> Added **${currentSong.artist} - ${currentSong.title}** to your favorites.`
		});
	}
});

commands.on('defaultvoice', function(user, userID, channelID, message) {
	var channel = message.split(' ')[1];
	var server = bot.serverFromChannel(channelID);
	var channels = bot.servers[server].channels;
	
	if (mods.indexOf(user) > -1) {
		Object.keys(channels).forEach(function(key) {
			if (channels[key].name === channel && channels[key].type === 'voice') {
				music.servers[server] = {
					channel:channels[key].id,
					autojoin:true
				};
			}
		});
	}
});


function join(channelID) {
	var server = bot.serverFromChannel(channelID);
	bot.joinVoiceChannel(channelID, function() {
		console.log(`joined Voice channel - ${channelID}`);
		servers[server] = new Server(server, channelID);
	});
}



function play(channelID) {
	var server = bot.serverFromChannel(channelID);
	stopped = false;
	var rand;
	if (servers[server]) {
		bot.getAudioContext({
			channel: servers[server].channel,
			stereo: true
		}, function(stream) {
			if (!servers[server].currentSong) {
				if (servers[server].queue.length > 0) {
					var temp = servers[server].queue.shift();
					if (temp === "Random.mp3") {
						rand = Math.floor(Math.random() * music.songs.length);
						servers[server].currentSong = music.songs[rand];
						stream.playAudioFile('./music/' + music.songs[rand].file);
						servers[server].playing = true;
						servers[server].elapsed_duration = 0;
						servers[server].elapsed_interval = setInterval(function() {
							servers[server].elapsed_duration++;
						}, 1000);
						console.log(music.songs[rand].title + " is now playing");
					}
					else {
						servers[server].currentSong = temp;
						stream.playAudioFile('./music/' + temp.file);
						servers[server].playing = true;
						servers[server].elapsed_duration = 0;
						servers[server].elapsed_interval = setInterval(function() {
							servers[server].elapsed_duration++;
						}, 1000);
						
						console.log(temp.title + " is now playing");
					}
				}
				else {
					rand = Math.floor(Math.random() * music.songs.length);
					servers[server].currentSong = music.songs[rand];
					stream.playAudioFile('./music/' + music.songs[rand].file);
					servers[server].playing = true;
					servers[server].elapsed_duration = 0;
					servers[server].elapsed_interval = setInterval(function() {
						servers[server].elapsed_duration++;
					}, 1000);
					console.log(music.songs[rand].title + " is now playing");
				}
				stream.once('fileEnd', function() {
					if (servers[server].currentSong) {
						servers[server].currentSong.plays++;
					}
					servers[server].playing = false;
					servers[server].currentSong = undefined;
					servers[server].elapsed_duration = 0;
					clearInterval(servers[server].elapsed_interval);
					if (servers[server].isEmpty()) {
						console.log("stopped playing because no one is here");
						stop(channelID);
					}
					if (!stopped) {
						setTimeout(function() {
							play(channelID);
						}, 2000);
					}
				});
			}
		});
	}
}

function current(channelID) {
	var server = bot.serverFromChannel(channelID);
	var conditionalString = "";
	if (servers[server]) {
		if (servers[server].currentSong) {
			if (servers[server].currentSong.beatmap) conditionalString = `beatmap: <https://osu.ppy.sh/s/${servers[server].currentSong.beatmap}>`;
			bot.sendMessage({
				to: channelID,
				message: `Currently playing: **${servers[server].currentSong.artist} - ${servers[server].currentSong.title}** [${numeral(servers[server].elapsed_duration).format('00:00').substring(2)}/${numeral(servers[server].currentSong.duration).format('00:00').substring(2)}], played ${servers[server].currentSong.plays} times\n${conditionalString}`
			});
		}
	}
}

/* The reason for the stopped bool is because stoping the song will emit 
 * 'fileEnd' which will automatically play a song.
 */
function stop(channelID) {
	var server = bot.serverFromChannel(channelID);
	bot.getAudioContext({
		channel: servers[server].channel,
		stereo: true
	}, function(stream) {
		stopped = true;
		setTimeout(function() {
			stream.stopAudioFile();
		}, 1000);
	});
}

function q(message, channelID, user, userID, cmd) {
	var server = bot.serverFromChannel(channelID);
	if (servers[server]) {
		if ((message === `${db.settings.prefix}queue`) || (message === `${db.settings.prefix}q`)) {
			printQ(message, channelID);
		}
		else {
			var title = message.substring(cmd.length + 1).toLowerCase();
			console.log("title: " + title);
			var index = music.songs.findIndex(function(ele) {
				var searchRegex = new RegExp(title, "i");
				if (searchRegex.test(ele.title)) return true;
				if (searchRegex.test(ele.artist)) return true;
			});
			
			
			if (/^fave$/i.test(title)) {
				if (music.users[userID] && music.users[userID].faves) {
					var rand = Math.floor(Math.random() * music.users[userID].faves.length);
					servers[server].queue.push(music.songs[rand]);
					bot.sendMessage({
						to: channelID,
						message: `<@${userID}>, ${music.songs[rand].artist} - ${music.songs[rand].title} has been added to the queue.`
					});
				}
			} else if (index > -1 && !/^fave$/i.test(title)) {
				if (servers[server].queue.indexOf(music.songs[index]) === -1) {
					servers[server].queue.push(music.songs[index]);
					bot.sendMessage({
						to: channelID,
						message: `<@${userID}>, ${music.songs[index].artist} - ${music.songs[index].title} has been added to the queue.`
					});
				}
				else {
					bot.sendMessage({
						to: channelID,
						message: `<@${userID}>, ${music.songs[index].artist} - ${music.songs[index].title} is already in the queue and will not be added.`
					});
				}
			}
			else if (/^fave$/i.test(title) === false) {
				if (title === "random") {
					servers[server].queue.push("Random.mp3");
				}
				else {
					bot.sendMessage({
						to: channelID,
						message: "<@" + userID + ">, That song could not be found. Please check your spelling or use getmap to download the song."
					});
				}
			}
		}
	}
}

function getMap(message, channelID, user, userID, cmd) {
	var setRegex = /.*http(s|):\/\/osu.ppy.sh\/(s|b)\/([0-9]*)((\?|\&)m=[0-9]|)/;
	//var info = {};
	if (setRegex.test(message)) {
		var mapType = JSON.parse('{"' + message.replace(setRegex, '$2') + '": ' + message.replace(setRegex, '$3') + '}');
		osu.getBeatmapsRaw(mapType, function(err, info) {
			if (err) console.log(err);
			//var path = settings.path;
			info = info[0];
			//info.approved == "3" || info.approved == "2" || info.approved == "1" || info.approved == "0" && mods.indexOf(user) > -1 || info.approved == "-1" && mods.indexOf(user) > -1 || info.approved == "-2" && mods.indexOf(user) > -1
			if (info.approved == "3" || info.approved == "2" || info.approved == "1" || info.approved == "0" || info.approved == "-1" || info.approved == "-2") {
				var index = music.songs.findIndex(function(ele) {
					if (ele.title.toLowerCase() === info.title.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/gi, '').toLowerCase() && ele.artist.toLowerCase() === info.artist.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/gi, '').toLowerCase()) return true;
				});
				if (index === -1) {
					//console.log(message.replace(setRegex, '$2'));
					var escaped_title = `${info.artist.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/g, '')} - ${info.title.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/g, '')}`;
					//var fileRar = fs.createWriteStream("tmp.osz");
					var songPath = "";
					var extension = "";
					fs.stat(`./${info.beatmapset_id}.zip`, function(err, stat) {
						if (err == null) {
							bot.sendMessage({
								to: channelID,
								message: info.title + " is already being downloaded"
							});
						}
						else {
							//var url = 'http://osu.ppy.sh/d/' + info.beatmapset_id;
							bot.sendMessage({
								to: channelID,
								message: info.title + " is being downloaded"
							});
							var formData = {
								login: 'login',
								password: db.osu_password,
								username: db.osu_username
							};
							request.post({
								url: "https://osu.ppy.sh/forum/ucp.php?mode=login",
								formData: formData
							}, function(err, res, body) {
								if (err) {
									return console.error(err);
								}
								//console.log(res);
								var notAvailableRegex = /This download is no longer available/i;
								var notAvailable = false;
								request.get('https://osu.ppy.sh/d/' + info.beatmapset_id, function(err, res, body) {
									if (err) {
										console.log(err);
									}
									if (notAvailableRegex.test(body)) {
										bot.sendMessage({
											to: channelID,
											message: info.title + " is not available to download"
										});
										notAvailable = true;
										return;
									}
								}).pipe(fs.createWriteStream(`./${info.beatmapset_id}.zip`)).on('finish', function() {
									console.log("finished downloading");
									fs.mkdir(`./${info.beatmapset_id}/`, function(err) {
										if (err) console.log(err);
									});
									if (!notAvailable) {
										fs.createReadStream(`./${info.beatmapset_id}.zip`).pipe(unzip.Extract({
											path: `./${info.beatmapset_id}/`
										}));
										setTimeout(function() {
											fs.readdir(`./${info.beatmapset_id}/`, function(error, files) {
												var pathRegex = /(\\|\/|:|\*|\?|"|<|>|\|)/g;
												if (error) console.log("something went wrong");

												fs.stat(`./${info.beatmapset_id}/${info.artist.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/g, '')} - ${info.title.replace(pathRegex, '')} (${info.creator.replace(pathRegex, '')}) [${info.version.replace(pathRegex, '')}].osu`, function(error, stats) {
													fs.open(`./${info.beatmapset_id}/${info.artist.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/g, '')} - ${info.title.replace(pathRegex, '')} (${info.creator.replace(pathRegex, '')}) [${info.version.replace(pathRegex, '')}].osu`, "r", function(error, fd) {
														var buffer = new Buffer(stats.size);

														fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
															var data = buffer.toString("utf8", 0, buffer.length).split('\n');

															songPath = data[3].replace(/AudioFilename: (.*(\.mp3|\.ogg))/i, '$1').split('\r')[0];
															extension = data[3].replace(/AudioFilename: (.*(\.mp3|\.ogg))/i, '$2').split('\r')[0].trim();
															songPath = songPath.trim();
															//console.log('"' + songPath + '"');
															fs.close(fd);
														});
													});
												});
											});
											setTimeout(function() {
												fs.rename(`./${info.beatmapset_id}/${songPath}`, "./music/" + escaped_title + extension, function(err) {
													if (err) console.log(err);
												});
												probe(`./music/${escaped_title}${extension}`, function(err, metadata) {
													if (err) console.error(err);
													//console.log(metadata);
													music.songs.push({id: music.songs[music.songs.length - 1].id + 1, title: info.title, file: escaped_title + extension, artist: info.artist, plays: 0, faves: 0, duration: parseInt(metadata.format.duration), beatmap: parseInt(info.beatmapset_id)});
												});
											}, 100);
											setTimeout(function() {
												deleteFolderRecursive(`./${info.beatmapset_id}/`);
												fs.unlink(`./${info.beatmapset_id}.zip`);
												//console.log("Getmap is complete now!");
												bot.sendMessage({
													to: channelID,
													message: info.title + " has been downloaded"
												});
											}, 2000);
										}, 3000);
									}
									if (notAvailable) {
										deleteFolderRecursive(`./${info.beatmapset_id}/`);
										fs.unlink(`./${info.beatmapset_id}.zip`);
									}
								});

							});
						}
					});
				}
				else {
					bot.sendMessage({
						to: channelID,
						message: info.title + " have already been downloaded"
					});
				}
			}
			else {
				bot.sendMessage({
					to: channelID,
					message: "Only mods can download unranked maps"
				});
			}
		});
	}
}

function printQ(msg, channelID) {
	var server = bot.serverFromChannel(channelID);
	if (servers[server]) {
		var message;
		if (servers[server].queue.length < 1) {
			message = "There are currently no songs in the queue.";
		}
		else {
			var total_duration = 0;
			var i;
			message = "The current song queue is:\n";
			for (i = 0; i < servers[server].queue.length; i++) {
				total_duration += servers[server].queue[i].duration;
				message = `${message}${i + 1}. **${servers[server].queue[i].artist} - ${servers[server].queue[i].title}** [${numeral(servers[server].queue[i].duration).format('00:00').substring(2)}]\n`;
			}
			message += `Queue time: ${numeral(servers[server].getQueueDuration()).format('00:00')}`;
		}
		bot.sendMessage({
			to: channelID,
			message: message
		});
	}
}

function skip(user, channelID) {
	var server = bot.serverFromChannel(channelID);
	if (servers[server]) {
		console.log(user);
		if (mods.indexOf(user) > -1) {
			stop(channelID);
			setTimeout(function() {
				play(channelID);
			}, 2000);
			console.log("skipped");
		}
	}
}


function clear(user, channelID) {
	var server = bot.serverFromChannel(channelID);
	if (servers[server]) {
		if (mods.indexOf(user) > -1) {
			servers[server].queue = [];
			console.log("queue has been cleared");
		}
	}
}
