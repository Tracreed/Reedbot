var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

/*commands.on('', function (user, userID, channelID, message, args) {
});*/

commands.on('invite', function invite(user, userID, channelID, message, args) {
    bot.sendMessage({
        to:channelID,
        message: `${bot.inviteURL}`
    });
});

commands.on('clear', function clear(user, userID, channelID, message, args) {
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

commands.on('lastmention', function lastmention(user, userID, channelID, message, args) {
    var messages = bot.getMessages({
        channel: channelID,
        limit: 5000
    });
});

commands.on('hideCommand', function (user, userID, channelID, message, args) {
    if (userID !== db.settings.owner) return;
    if (typeof(db.settings.hidden_commands) === 'undefined') db.settings.hidden_commands = [];
    db.settings.hidden_commands.push(args._.join());
});

commands.on('help', function help(user, userID, channelID, message, args) {
    var commandNames = commands.eventNames();
    if (db.settings.hidden_commands) {
        var hiddenCommands = db.settings.hidden_commands;
    } else {
        var hiddenCommands = [];
    }
    var commandList = '';
    for (var i = 0; i < commandNames.length; i++) {
        if (hiddenCommands.indexOf(commandNames[i]) === -1) commandList += `${commandNames[i]}\n`;
    }
    bot.sendMessage({
        to: userID,
        message: `To add me to your server, use this link: ${bot.inviteURL}\nCommands for ${bot.username}:\n\`\`\`${commandList}\`\`\``
    });
});

commands.on('info', function info(user, userID, channelID, message, args) {
    bot.sendMessage({
        to: channelID,
        message: `${bot.username} is a bot made by Tracreed using node ${process.version} and discord.io\n`
    });
});

commands.on('ping', function ping(user, userID, channelID, message, args) {
    bot.sendMessage({
        to: channelID,
        message: `pong`
    });
});