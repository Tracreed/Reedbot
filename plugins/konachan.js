var request = require('request');
var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;
var cheerio = require('cheerio');
var previous_pics = [];

commands.on('konachan', function(user, userID, channelID, message) {
    if (message.length > 9) {
        var tags = message.replace(`${db.settings.prefix}konachan `, '').replace(' ', '+');
    } else {
        tags = "";
    }
    request.get(`http://konachan.com/post?tags=${tags}`, function(error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);
            var pages = $('.pagination').children().last().prev().text();
            pages = parseInt(pages, 10);
            var page = Math.floor(Math.random() * pages);
            request.get(`http://konachan.com/post.json?limit=21&tags=${tags}&page=${page}`, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    var index = Math.floor(Math.random() * (data.length - 1));
                    if (data[index]) {
                        var retry_count = 0;
                        while (previous_pics.indexOf(data[index].id) > -1 && retry_count < 25) {
                            index = Math.floor(Math.random() * (data.length - 1));
                            retry_count++;
                        }
                        if (previous_pics.length > 100) {
                            previous_pics.shift();
                        }
                        var options = {
                            url:"https://www.googleapis.com/urlshortener/v1/url?key=" + db.settings.url_shortener_key,
                            json:true,
                            body:{
                                "longUrl":data[index].jpeg_url
                            }
                        };
                        
                        
                        request.post(options, function(err, resp, bod) {
                            if (!err && resp.statusCode == 200) {
                                previous_pics.push(data[index].id);
                                bot.sendMessage({
                                    to: channelID,
                                    message: `\\(${data[index].rating.replace('e', 'Explicit').replace('s', 'Safe').replace('q', 'Questionable')}) ${data[index].tags.replace(/_/g, '\\_')} (${data[index].width}x${data[index].height}) ${bod.id}`
                                });
                            }
                        });
                        
                    } else {
                        console.log(index, data.length);
                        console.log(data[index]);
                        bot.sendMessage({
                            to: channelID,
                            message: "No results found"
                        });
                    }
                }
            });
        }
    });
});