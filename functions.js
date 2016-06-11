/*global commands*/
/*global bot*/
/*global db*/

var defaultPerm = {
    canManageQuotes: false,
    canManageAnnounce: false,
    canManageMusic: false
};

module.exports = {
    getPermission: function(perm, serverID, userID) {
        var roles = bot.servers[serverID].members[userID].roles;
        if (roles.length < 1) {
            return defaultPerm[perm];
        }
        for (var i = 0; i < roles.length; i++) {
            if (db.permissions[roles[i]][perm]) {
                return true;
            } else {
                return false;
            }
        }
    }
};