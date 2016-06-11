var malApi = "http://myanimelist.net/api/";
var malUrl = "http://myanimelist.net";
var xmlParser = require('xml2json');
var cheerio = require('cheerio');
var request = require('request');
var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

commands.on('anime', function(user, userID, channelID, message, args) {
    var title = args._.join('+');
    request.get(`${malApi}anime/search.xml?q=${title}`, {
        'auth': {
            'user': db.settings.mal_user,
            'pass': db.settings.mal_pass
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var result = JSON.parse(xmlParser.toJson(body, {
                sanitize: false
            })).anime.entry[0];
            bot.sendMessage({
                to: channelID,
                message: `**Title:** ${result.title}\n**Type:** ${result.type}\n**Episodes:** ${result.episodes}\n**Score:** ${result.score}\n**Synopsis:** ${result.synopsis.replace(/&quot;/g, '"').replace(/<br \/>/g, "").replace(/(\[i\]|\[\/i\])/g, "*")}`
            });
        }
    });
});

commands.on('character', function(user, userID, channelID, message, args) {
    var character_name = args._.join('+');
    var character = {};
    request.get(`${malUrl}/character.php?q=${character_name}`, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var characters = $('td.borderClass[width="175"] a');
            if (characters.length) {
                request.get(malUrl + characters['0'].attribs.href, function(err, resp, body) {
                    if (!err && resp.statusCode == 200) {
                        var $ = cheerio.load(body);
                        character.id = parseInt(characters['0'].attribs.href.replace(/.*\/(\d+)\/.*/, '$1'), 10);
                        character.titles = $('div#contentWrapper div h1.h1').text();
                        character.name = $('div.normal_header[style="height: 15px;"]').contents().not('span').text().trim();
                        character.jap_name = $('div.normal_header[style="height: 15px;"]').contents('span').contents('small').text().replace('(', '').replace(')', '');
                        character.image = $('td[valign="top"] div[style="text-align: center;"] a img').attr('src');
                        character.description = $('td[valign="top"][style="padding-left: 5px;"]').contents().filter(function() {return this.nodeType === 3;}).filter(function() {if (/\S+[\w ]/.test(this.data)) {return this}}).text();
                        if (character.description.length > 1000) character.description = character.description.substr(0, 1000) + '...';
                        character.voice_actors = [];
                        $('td[valign=top][style="padding-left: 5px;"]').find('table').each(function(i, elem){
                            character.voice_actors.push({
                                id:parseInt($(this).find($('tr td a')).attr('href').replace(/.*\/(\d+)\/.*/, '$1'), 10),
                                image:$(this).find($('tr td[width=25] div a img')).attr('src').replace(/v\.jpg/, '.jpg'),
                                name:$(this).find($('tr td a')).text(),
                                language:$(this).find($('tr td div small')).text()
                            });
                        });
                        character.animeography = [];
                        $('td[width="225"] div.normal_header:contains("Animeography")').next().contents().filter(function() {return this.type === "tag"}).each(function(i, elem){
                            character.animeography.push({
                                id:parseInt($(this).find($('tr td a').not('.button_add')).attr('href').replace(/.*\/(\d+)\/.*/, '$1')),
                                title:$(this).find($('tr td a').not('.button_add')).text(),
                                role:$(this).find($('tr td div small')).text()
                            });
                        });
                        character.mangaography = [];
                        $('td[width="225"] div.normal_header:contains("Mangaography")').next().contents().filter(function() {return this.type === "tag"}).each(function(i, elem){
                            character.mangaography.push({
                                id:parseInt($(this).find($('tr td a').not('.button_add')).attr('href').replace(/.*\/(\d+)\/.*/, '$1')),
                                title:$(this).find($('tr td a').not('.button_add')).text(),
                                role:$(this).find($('tr td div small')).text()
                            });
                        });
                        character.favorites = parseInt($('td[width=225]').contents().last().text().replace(/(.|\W)* (\d+)(.|\W)*/, '$2'));
                        
                        bot.sendMessage({
                            to: channelID,
                            message: `**Name**: ${character.name} (<http://myanimelist.net/character/${character.id}/>)\n**Japanese Name**: ${character.jap_name}\n**Description**: ${character.description}\n**Image**: ${character.image}\n**Favorites**: ${character.favorites}`
                        });
                        console.log(character);
                    }
                });
            }
        }
    });
});


