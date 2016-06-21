var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;
var osuapi = require('osu-api');
var osu = new osuapi.Api(db.settings.osu_api_key);
var numeral = require('numeral');
var moment = require('moment-timezone');

commands.on('osu', function(user, userID, channelID, message, args) {
    osu.setMode('0');
    var osu_name;
    if (args._.length && args._[0].length > 0) {
        osu_name = args._.join(' ').toLowerCase();
    }
    else if (typeof(db.osu) === 'object') {
        if (typeof(db.osu[userID]) === 'object') {
            if (db.osu[userID].osu_name) {
                osu_name = db.osu[userID].osu_name.toLowerCase();
            } else {
                osu_name = user.toLowerCase();
            }
        }
    }
    if (args.m) {
        args.m = String(args.m);
        osu.setMode(args.m.replace(/taiko/i, '1').replace(/ctb|catchthebeat|fruits|catch|ceeteebee/i, '2').replace(/mania/i, '3').replace(/osu|standard|std/i, '0'));
    }
    else if (typeof(db.osu) === 'object') {
        if (typeof(db.osu[userID]) === 'object' && osu_name == user.toLowerCase() || typeof(db.osu[userID]) === 'object' && osu_name == db.osu[userID].osu_name.toLowerCase()) {
            if (db.osu[userID].mode) osu.setMode(db.osu[userID].mode);
        }
    }
    console.log(osu_name);
    osu.getUser(osu_name, function(err, data) {
        if (err) console.error(err);
        if (data) {
            bot.sendMessage({
                to: channelID,
                message: `${data.username} (<https://osu.ppy.sh/u/${data.user_id}>)\n${String(osu.mode).replace('0', 'Osu').replace('1', 'Taiko').replace('2', 'CTB').replace('3', 'Mania')}\n${data.pp_raw}pp (#${data.pp_rank}, #${data.pp_country_rank} :flag_${data.country.toLowerCase()}:)\nPlayCount: ${numeral(data.playcount).format('0,0')}\nRanked Score: ${numeral(data.ranked_score).format('0,0')}\nTotal Score: ${numeral(data.total_score).format('0,0')}\nLevel: ${data.level}\nAccuracy: ${parseFloat(data.accuracy).toFixed(2)}%\nProfile Picture: https://a.ppy.sh/${data.user_id}_0.jpg`
            });
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "User Not found"
            });
        }
    });
});

commands.on('osur', function(user, userID, channelID, message, args) {
    osu.setMode('0');
    var osu_name;
    if (args._.length && args._[0].length > 0) {
        osu_name = args._.join(' ').toLowerCase();
    }
    else if (typeof(db.osu) === 'object') {
        if (typeof(db.osu[userID]) === 'object') {
            if (db.osu[userID].osu_name) {
                osu_name = db.osu[userID].osu_name.toLowerCase();
            } else {
                osu_name = user.toLowerCase();
            }
        }
    }
    if (args.m) {
        args.m = String(args.m);
        osu.setMode(args.m.replace(/taiko/i, '1').replace(/ctb|catchthebeat|fruits|catch|ceeteebee/i, '2').replace(/mania/i, '3').replace(/osu|standard|std/i, '0'));
    }
    else if (typeof(db.osu) === 'object') {
        if (typeof(db.osu[userID]) === 'object' && osu_name == user.toLowerCase() || typeof(db.osu[userID]) === 'object' && osu_name == db.osu[userID].osu_name.toLowerCase()) {
            if (db.osu[userID].mode) osu.setMode(db.osu[userID].mode);
        }
    }
    osu.getUser(osu_name, function(err, user) {
        if (!err && user) {
            osu.getUserRecent(user.user_id, function(err, score) {
                if (err) console.error(err);
                if (score[0]) {
                    score = score[0];
                    osu.getBeatmap(score.beatmap_id, function(error, beatmap) {
                        if (!error && beatmap) {
                            var full_combo = "";
                            if (score.perfect === "1") full_combo = ", Full Combo";
                            var mods = getMods(score.enabled_mods);
                            var accuracy = getAccuracy(score, osu.mode);
                            bot.sendMessage({
                                to: channelID,
                                message: `${user.username} last played **${beatmap.artist} - ${beatmap.title} [${beatmap.version}]** (\`${numeral(beatmap.difficultyrating).format('0.00')} stars${mods}\`) and scored \`${numeral(score.score).format('0,0')}\` (\`${score.rank}, ${accuracy}%, ${score.maxcombo} max combo${full_combo}\`) ${moment.tz(score.date, "YYYY-MM-DD HH:mm:ss", "Australia/Perth").fromNow()} [<https://osu.ppy.sh/b/${beatmap.beatmap_id}&m=${osu.mode}>]`
                            });
                        }
                    });
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: "This user has not played recently."
                    });
                }
            });
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "Something went wrong. Are you sure the user exists?"
            });
        }
    });
});


commands.on('osub', function(user, userID, channelID, message, args) {
    osu.setMode('0');
    var osu_name;
    if (args._.length && args._[0].length > 0) {
        osu_name = args._.join(' ').toLowerCase();
    }
    else if (typeof(db.osu) === 'object') {
        if (typeof(db.osu[userID]) === 'object') {
            if (db.osu[userID].osu_name) {
                osu_name = db.osu[userID].osu_name.toLowerCase();
            } else {
                osu_name = user.toLowerCase();
            }
        }
    }
    if (args.m) {
        args.m = String(args.m);
        osu.setMode(args.m.replace(/taiko/i, '1').replace(/ctb|catchthebeat|fruits|catch|ceeteebee/i, '2').replace(/mania/i, '3').replace(/osu|standard|std/i, '0'));
    }
    else if (typeof(db.osu) === 'object') {
        if (typeof(db.osu[userID]) === 'object' && osu_name == user.toLowerCase() || typeof(db.osu[userID]) === 'object' && osu_name == db.osu[userID].osu_name.toLowerCase()) {
            if (db.osu[userID].mode) osu.setMode(db.osu[userID].mode);
        }
    }
    osu.getUser(osu_name, function(err, user) {
        if (!err && user) {
            osu.getUserBest(user.user_id, function(err, score) {
                if (err) console.error(err);
                if (score[0]) {
                    score = score[0];
                    osu.getBeatmap(score.beatmap_id, function(error, beatmap) {
                        if (!error && beatmap) {
                            //console.log(beatmap);
                            var full_combo = "";
                            var mods = getMods(score.enabled_mods);
                            //console.log(score);
                            if (score.perfect === "1") full_combo = ", Full Combo";
                            var accuracy = getAccuracy(score, osu.mode);
                            bot.sendMessage({
                                to: channelID,
                                message: `${user.username}'s best rank is **${beatmap.artist} - ${beatmap.title} [${beatmap.version}]** (\`${numeral(beatmap.difficultyrating).format('0.00')} stars${mods}\`) with a score of \`${numeral(score.score).format('0,0')}\` (\`${score.rank}, ${accuracy}%, ${score.maxcombo} max combo${full_combo}\`) giving ${numeral(score.pp).format('0.000')}pp [<https://osu.ppy.sh/b/${beatmap.beatmap_id}&m=${osu.mode}>]`
                            });
                        }
                    });
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: "Something went wrong"
                    });
                }
            });
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "Something went wrong. Are you sure the user exists?"
            });
        }
    });
});

function getMods(mods) {
    var returnString = ", ";

    var ModsEnum = {
    None: 0,
    NoFail: 1,
    Easy: 2,
    //NoVideo      = 4,
    Hidden: 8,
    HardRock: 16,
    SuddenDeath: 32,
    DoubleTime: 64,
    Relax: 128,
    HalfTime: 256,
    Nightcore: 512, // Only set along with DoubleTime. i.e: NC only gives 576
    Flashlight: 1024,
    Autoplay: 2048,
    SpunOut: 4096,
    Relax2: 8192,  // Autopilot?
    Perfect: 16384,
    Key4: 32768,
    Key5: 65536,
    Key6: 131072,
    Key7: 262144,
    Key8: 524288,
    keyMod: 32768 | 65536 | 131072 | 262144 | 524288,
    FadeIn: 1048576,
    Random: 2097152,
    LastMod: 4194304,
    FreeModAllowed: 1 | 2 | 8 | 16 | 32 | 1024 | 1048576 | 16384 | 8192 | 4096 | (32768 | 65536 | 131072 | 262144 | 524288),
    Key9: 16777216,
    Key10: 33554432,
    Key1: 67108864,
    Key3: 134217728,
    Key2: 268435456
};

    if ((mods & ModsEnum.DoubleTime) == ModsEnum.DoubleTime) {
        if ((mods & ModsEnum.Nightcore) == ModsEnum.Nightcore) returnString += "NC ";
        else returnString += "DT ";
    }
    if ((mods & ModsEnum.Hidden) == ModsEnum.Hidden) returnString += "HD ";
    if ((mods & ModsEnum.Easy) == ModsEnum.Easy) returnString += "EZ ";
    if ((mods & ModsEnum.Flashlight) == ModsEnum.Flashlight) returnString += "FL ";
    if ((mods & ModsEnum.HalfTime) == ModsEnum.HalfTime) returnString += "HT ";
    if ((mods & ModsEnum.HardRock) == ModsEnum.HardRock) returnString += "HR ";
    if ((mods & ModsEnum.NoFail) == ModsEnum.NoFail) returnString += "NF ";
    if ((mods & ModsEnum.Perfect) == ModsEnum.Perfect) returnString += "PF ";
    if ((mods & ModsEnum.SuddenDeath) == ModsEnum.SuddenDeath) returnString += "SD ";
    if ((mods & ModsEnum.Random) == ModsEnum.Random) returnString += "Random ";
    if ((mods & ModsEnum.LastMod) == ModsEnum.LastMod) returnString += "7K ";
    if ((mods & ModsEnum.Relax) == ModsEnum.Relax) returnString += "Relax ";
    if ((mods & ModsEnum.Relax2) == ModsEnum.Relax2) returnString += "AutoPilot ";
    if ((mods & ModsEnum.SpunOut) == ModsEnum.SpunOut) returnString += "SpunOut ";
    if ((mods & ModsEnum.Autoplay) == ModsEnum.Autoplay) returnString += "Autoplay ";
    if ((mods & ModsEnum.Key1) == ModsEnum.Key1) returnString += "1K ";
    if ((mods & ModsEnum.Key2) == ModsEnum.Key2) returnString += "2K ";
    if ((mods & ModsEnum.Key3) == ModsEnum.Key3) returnString += "3K ";
    if ((mods & ModsEnum.Key4) == ModsEnum.Key4) returnString += "4K ";
    if ((mods & ModsEnum.Key5) == ModsEnum.Key5) returnString += "5K ";
    if ((mods & ModsEnum.Key6) == ModsEnum.Key6) returnString += "6K ";
    if ((mods & ModsEnum.Key7) == ModsEnum.Key7) returnString += "7K ";
    if ((mods & ModsEnum.Key8) == ModsEnum.Key8) returnString += "8K ";
    if ((mods & ModsEnum.Key9) == ModsEnum.Key9) returnString += "9K ";
    if ((mods & ModsEnum.Key10) == ModsEnum.Key10) returnString += "10K ";

    returnString = returnString.trim();

    if (returnString == ",") {
        return "";
    }
    else {
        return returnString;
    }
}

function getAccuracy(score, mode) {
    var accuracy;
    switch (mode) {
        case "1":
            accuracy = (((score.count100 * 0.5) + (score.count300 * 1)) * 300 / ((score.count300 + score.count100 + score.countmiss) * 300) * 100).toFixed(2);
            break;
        case "2":
            accuracy = (((score.count50 + score.count100 + score.count300) * 100) / (score.count50 + score.count100 + score.count300 + score.countmiss + score.countkatu)).toFixed(2);
            break;
        case "3":
            accuracy = (((score.countgeki * 300) + (score.count300 * 300) + (score.countkatu * 200) + (score.count100 * 100) + (score.count50 * 50)) / ((score.countgeki + score.count300 + score.countkatu + score.count100 + score.count50 + score.countmiss) * 300) * 100).toFixed(2);
            break;
        default:
            accuracy = (((score.count300 * 300) + (score.count100 * 100) + (score.count50 * 50) + (score.countmiss * 0)) / ((score.count300 + score.count100 + score.count50 + score.countmiss) * 300) * 100).toFixed(2);
            break;
    }
    return accuracy;
}