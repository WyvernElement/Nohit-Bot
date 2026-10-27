const { Nohit } = require("../objects/Nohit.js");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0] ?? message.author.id;
    const user = await NohitService.userData.getUser(id);
    if(user === undefined){
        return message.reply("Who're you after? That's not a person.");
    }
    else{
        let response = `## Overview for ${client.users.fetch(id).username}`;
        let total = 0;
        let v = 0;
        let dq = 0;
        NohitService.updateJourneys();
        for (const [difficulty, id] of user.OwnedNohits){
            const journey = await NohitService.lookupJourney(id);
            total += journey.Total;
            v += journey.V;
            dq += journey.DQ;
        }
        response += `\nThis user has submitted **__${total}__** total nohits, out of which:
        **${v}** have been verified,
        **${dq}** have been disqualified,
        and **${total - v - dq}** are still pending review.`;
        for (const [difficulty, id] of user.OwnedNohits){
            const journey = await NohitService.lookupJourney(id);
            response += `\n### **${difficulty}:**
            Verified: ${journey.V}
            Disqualified: ${journey.DQ}
            Pending: ${journey.Pending}`;
            const link = user.Playlists.get(difficulty);
            if (link === undefined){
                response += "\nNo playlist? What next, no nohits? Come on, now!";
            }
            else{
                response += `\n[Playlist](${link})`;
            }
        }
        return message.reply(response);
    }
}

module.exports = {
    run
}