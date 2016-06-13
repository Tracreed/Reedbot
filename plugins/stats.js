var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

var numeral = require('numeral');
if (typeof db.stats === 'undefined') {
    db.stats = {};
}

var defUser = {
    usernames:[],
    lastMessage:"",
    commandsUsed:0,
    command: {},
    messages: [],
    messagesSent:0
}

var parsedCommands = 0;
var messagesRecieved = 0;

bot.on('message', function(user, userID, channelID, message, rawEvent) {
    db.stats[userID] = Object.assign({}, defUser, db.stats[userID], bot.users[userID]);
    var newUserNameIndex = db.stats[userID].usernames.findIndex(function(element, index, arr) {
        return db.stats[userID].usernames[index] === bot.users[userID].username;
    });
    if (newUserNameIndex === -1) {
        db.stats[userID].usernames.push(bot.users[userID].username);
    } 
    var tmp = message.replace(new RegExp(`\\${db.settings.prefix}(\\w*)(\\s.*|)`), "$1");
    messagesRecieved++;
    db.stats[userID].lastMessage = message;
    db.stats[userID].messages.push(message);
    if (db.stats[userID].messages.length > 100) {
        db.stats[userID].messages.shift();
    }
    db.stats[userID].messagesSent++;
    if (message.substr(0, db.settings.prefix.length) !== db.settings.prefix) {
        return;
    }
    if (commands.listenerCount(tmp.toLowerCase())) {
        db.stats[userID].commandsUsed = db.stats[userID].commandsUsed + 1;
        if (typeof(db.stats[userID].command[tmp]) === 'undefined') {
            db.stats[userID].command[tmp] = {
                used: 0
            };
        }
        db.stats[userID].command[tmp].used = db.stats[userID].command[tmp].used + 1;
        parsedCommands++;
    }
});

commands.on('stats', function(user, userID, channelID, message, args) {
    var uptime = secToHours(process.uptime());
    var commandsString = "";
    if (parsedCommands > 1) {
        commandsString = `${parsedCommands} commands parsed and `;
    } else if (parsedCommands === 1) {
        commandsString = `${parsedCommands} command parsed and `;
    }
    bot.sendMessage({
        to:channelID,
        message: `Uptime: ${uptime} \n${commandsString}${messagesRecieved} messages have been received\nI'm in ${Object.keys(bot.servers).length} servers\nMemory usage is ${numeral(process.memoryUsage().heapUsed).format('0 b')}`
    });
});

var secToHours = function(sec_num) {
    sec_num = parseInt(sec_num, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    return `${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
};