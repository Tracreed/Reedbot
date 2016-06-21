var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

var fs = require('fs');

commands.on('set', function(user, userID, channelID, message) {
    var args = message.split(' ');
    if (args[1] === "osu") {
        if (args[2] === "name") {
            if (args[3]) {
                if (db.osu[userID]) {
                    db.osu[userID].osu_name = args[3].toLowerCase();
                    bot.sendMessage({
                        to: channelID,
                        message: `<@${userID}> Username set`
                    });
                } else {
                    db.osu[userID] = {
                        "osu_name":args[3].toLowerCase()
                    };
                    bot.sendMessage({
                        to: channelID,
                        message: `<@${userID}> Username set`
                    });
                }
            }
        } else if (args[2] === "mode") {
            if (args[3]) {
                if (db.osu[userID]) {
                    db.osu[userID].mode = args[3].replace(/taiko/i, '1').replace(/ctb/i, '2').replace(/mania/i, '3').replace(/osu|standard|std/i, '0');
                    bot.sendMessage({
                        to: channelID,
                        message: `<@${userID}> Mode set`
                    });
                } else {
                    db.osu[userID] = {
                        "mode":args[3].replace(/taiko/i, '1').replace(/ctb/i, '2').replace(/mania/i, '3').replace(/osu|standard|std/i, '0')
                    };
                    bot.sendMessage({
                        to: channelID,
                        message: `<@${userID}> Mode set`
                    });
                }
            }
        }
    }
});