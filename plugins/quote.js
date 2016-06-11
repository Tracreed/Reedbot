var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

/*commands.on('', function roll(user, userID, channelID, message, args) {
});*/

var func = require('../functions.js');

commands.on('quote', function roll(user, userID, channelID, message, args) {
    var server = bot.serverFromChannel(channelID);
    var quote;
    if (typeof(db.server[server]) === 'undefined') {
        db.server[server] = {};
    }
    if (typeof(db.server[server].quotes) === 'undefined') {
        db.server[server].quotes = [];
    }
    var quotes = db.server[server].quotes;
    var lastID = 0;
    if (quotes.length >= 1) {
        lastID = quotes[quotes.length-1].id;
    }
    if (args._[0].length > 1) {
        switch (args._[0]) {
            case 'add':
                if (args._.length === 1) {
                    return;
                }
                quote = args._;
                quote.shift();
                quote = quote.join(' ');
                if (quote.length) {
                    quotes.push({id: lastID+1, added: Date.now(), quote: quote, addedBy:userID});
                    bot.sendMessage({
                        to:channelID,
                        message:`Added quote #${lastID+1} by ${bot.users[userID].username}\n${quote}`
                    });
                }
            break;
            case 'del':
                if (typeof(args._[1]) === 'number') {
                    var allowed = func.getPermission('canManageQuotes', server, userID);
                    if (!allowed) {
                        return;
                    }
                    var index = args._[1] - 1;
                    if (typeof(quotes[index].quote) === 'string' && quotes[index]) {
                        console.log(quotes.splice(index, 1));
                    }
                }
            break;
            case 'search':
                if (args._[1].length > 1) {
                    var searchString = args._;
                    searchString.shift();
                    searchString.join(' ');
                    var searchRegex = new RegExp(searchString, 'igm');
                    var results = quotes.filter(function(element, index, array) {
                        if (searchRegex.test(element.id)) return true;
                        if (searchRegex.test(element.quote)) return true;
                    });
                    if (results.length === 1) {
                        bot.sendMessage({
                            to:channelID,
                            message:results[0].quote
                        });
                    } else if (results.length < 20 && results.length) {
                        var resultString = "";
                        for (var i=0; i < results.length; i++) {
                            if (i + 1 === results.length) {
                                resultString += results[i].id;
                            } else {
                                resultString += results[i].id + ",";
                            }
                        } 
                        bot.sendMessage({
                            to:channelID,
                            message:`${results.length} matches found: #${resultString}`
                        });
                    } else if (results.length === 0) {
                        bot.sendMessage({
                            to:channelID,
                            message:`No results found`
                        });
                    } else if (results.length > 20) {
                        bot.sendMessage({
                            to:channelID,
                            message:`Too many search results, sent the results in pm`
                        });
                        bot.sendMessage({
                            to:userID,
                            message:`${results.length} matches found: #${resultString}`
                        });
                    }
                }
            break;
            case 'read':
                if (typeof(args._[1]) === 'number') {
                    index = args._[1] - 1;
                    if (typeof(quotes[index]) === 'object') {
                        var added = new Date(quotes[index].added).toDateString();
                        bot.sendMessage({
                            to:channelID,
                            message:`#${quotes[index].id} by ${bot.users[quotes[index].addedBy].username} ${added}\n${quotes[index].quote}`
                        });
                    } else {
                        bot.sendMessage({
                            to:channelID,
                            message:`${args._[1]} does not exist!`
                        });
                    }
                }
                
            break;
            case 'random':
                if (quotes.length === 0) {
                    return;
                }
                var randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                if (typeof(randomQuote) !== 'object') {
                    return;
                }
                added = new Date(randomQuote.added).toDateString();
                bot.sendMessage({
                    to:channelID,
                    message:`#${randomQuote.id} by ${bot.users[randomQuote.addedBy].username} ${added}\n${randomQuote.quote}`
                });
        }
    }
});