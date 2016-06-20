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

commands.on('clear', function roll(user, userID, channelID, message, args) {
    if (userID !== db.settings.owner) return;
    if (typeof(args._[0]) !== 'number') return;
    bot.getMessages({
        channel:channelID,
        limit: 100
    }, function(error, messages) {
        var botMessages = [];
        if (error) return console.log(error);
        for (var i=0; i < messages.length; i++) {
            if (messages[i].author.username !== bot.username) continue;
            botMessages.push(messages[i]);
            //bot.deleteMessage()
        }
        for (var i=0; i < args._[0]; i++) {
            bot.deleteMessage({
                channel: channelID,
                messageID: botMessages[i].id
            });
        }
    });
});

commands.on('lastmention', function roll(user, userID, channelID, message, args) {
    var messages = bot.getMessages({
        channel: channelID,
        limit: 5000
    });
});