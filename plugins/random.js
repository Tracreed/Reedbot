var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

/*commands.on('', function roll(user, userID, channelID, message, args) {
});*/

commands.on('invite', function roll(user, userID, channelID, message, args) {
    bot.sendMessage({
        to:channelID,
        message: `${bot.inviteURL}`
    });
});