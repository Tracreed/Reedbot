var commands = require('../bot.js').commands;
var bot = require('../bot.js').bot;
var db = require('../bot.js').db;

/*commands.on('', function roll(user, userID, channelID, message, args) {
});*/

var defaultPerm = {
    canManageQuotes: false,
    canManageAnnounce: false,
    canManageMusic: false
};

bot.on('ready', function() {
    for (var is in bot.servers) {
        var server = bot.servers[is];
        for (var ir in server.roles) {
            var role = server.roles[ir];
            if (typeof(db.permissions[role.id]) === 'object') {
                db.permissions[role.id] = Object.assign({}, defaultPerm, db.permissions[role.id]);
            } else {
                db.permissions[role.id] = defaultPerm;
            }
        }
    }
});

function roleFromRoleName(name, serverID) {
    var roles = bot.servers[serverID].roles;
    for (var i in roles) {
        var role = roles[i];
        if (role.name.toLowerCase() === name.toLowerCase()) return role.id;
    }
    return null;
}

commands.on('permissions', function roll(user, userID, channelID, message, args) {
    var server = bot.serverFromChannel(channelID);
    if (bot.servers[server].owner_id !== userID) {
        return;
    }
    
    if (args._[0].length === 0) {
        return;
    }
    
    switch (args._[0]) {
        case 'set':
            if (args._.length < 4) {
                return;
            }
            var role = args._[1].replace(/_/g, ' '),
                perm = args._[2],
                bool = args._[3];
            var roleID = roleFromRoleName(role, server);
            if (!roleID) {
                return;
            }
            
            if (typeof(db.permissions[roleID][perm]) !== 'boolean') {
                return;
            }
            if (bool.toLowerCase() === 'true') {
                db.permissions[roleID][perm] = true;
            } else if (bool.toLowerCase() === 'false') {
                db.permissions[roleID][perm] = false;
            }
        break;
    }
});
