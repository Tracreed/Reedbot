"use strict";
var DiscordClient = require('discord.io');
require("babel-register");
var db = require('./db.json');
var bot = new DiscordClient({
    autorun: true,
    token: ""
});
var fs = require('fs');
var parseArgs = require('minimist');
var events = require('events');
var commands = new events.EventEmitter();
var owner = "";

fs.readdir('./plugins/', function(err, files) {
    if (err) throw err;
    for (var i=0; i<files.length; i++) {
        if (/(\.js)/.test(files[i])) {
            require('./plugins/' + files[i]);
        }
    }
});

bot.on('ready', function() {
    console.log(bot.username + " - (" + bot.id + ")");
});

bot.on('message', function(user, userID, channelID, message, rawEvent) {
    //console.log(channelID, message);
    var args = parseArgs(message.replace(new RegExp(`\\${db.settings.prefix}\\S+([\\s]|)`), '').split(' '));
    var tmp = message.replace(new RegExp(`\\${db.settings.prefix}(\\w*)((.|\\n)*|)`), "$1");
    if (message.substr(0, db.settings.prefix.length) === db.settings.prefix) {
        console.log(`${user} - ${userID} ${tmp}`);
        console.log(args);
        commands.emit(tmp.toLowerCase(), user, userID, channelID, message, args);
    }
});

bot.on('disconnected', function() {
    bot.connect();
});

commands.on('eval', function(user, userID, channelID, message) {
    var code = message.replace(`${db.settings.prefix}eval `, '');
    console.log(code, userID);
    try {
        if (userID === owner) {
            bot.sendMessage({
                to:channelID,
                message: eval(code)
            });
        }
    } catch (err) {
        bot.sendMessage({
            to:channelID,
            message: err
        });
    }
});

commands.on('shutdown', function roll(user, userID, channelID, message, args) {
    if (userID === owner) {
        fs.writeFile('db.json', JSON.stringify(db, null, 4), 'utf8', function(err) {
            if (err) console.error(err);
            process.exit(0);
        });
    }
});

module.exports = {
    commands: commands,
    db:db,
    bot:bot
};