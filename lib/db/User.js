const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');

const db = require('./common');

const exp = {};

module.exports = exp;

const User = mongoose.models.User;
const TeamUser = mongoose.models.TeamUser;
const Team = mongoose.models.Team;

exp.getCoachTeams = function(myId, userId){
    return new Promise(
        async function(fulfill, reject) {

            console.log("getCoachTeams  coach=", userId);
            const teams = [];
            try {
                const ut = await TeamUser.findActive({userId: userId, role: 'coach'});
                console.log('Found teams ', ut.length);
                for (let i of ut) {
                    const t = await Team.findOneActive({_id: i.teamId});
                    teams.push({_id: t._id, name: t.name});
                }
                fulfill(teams);
            } catch (err) {
                console.log('Error getting coachTeams');
                console.log(err);
                reject(err);
            }
        }
    )
};
