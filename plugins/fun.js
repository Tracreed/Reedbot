var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

/*commands.on('', function roll(user, userID, channelID, message, args) {
});*/

commands.on('roll', function roll(user, userID, channelID, message, args) {
    bot.sendMessage({
        to:channelID,
        message:`<@${userID}> rolled ${Math.floor(Math.random() * 100)}`
    });
});

commands.on('8ball', function roll(user, userID, channelID, message, args) {
    var responses = ["It is certain", "It is decidedly so", "Without a doubt", "Yes, definitely", "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "Don't count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful"];
    var tmp = Math.floor(Math.random() * (responses.length - 1));
    bot.sendMessage({
        to:channelID,
        message:`${responses[tmp]}`
    });
});