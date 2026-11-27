const NohitService = require("../service/NohitService.js");

const Description = "unfinished but will show a collection of misc overall stats regarding nohits and journeys";

async function run(message, args, client, user){
    const {Stats, Diffs, Bosses} = await NohitService.stats(message.guildId);
    let c = 0.0;
    let t = 0.0;
    for (const journey of NohitService.nohitData.journeys.get(message.guildId).values()){
        if (journey.Completed){
            c++;
        }
        t++;
    }

    let response = "";
    for (const [diff, item] of new Map([...Diffs.entries()].sort((a, b) => b[1].T - a[1].T))){
        if (diff && diff != "Deleted"){
            response += `\n**[${diff}]** - ${item.T}`;
        }
    }
    return message.reply(`Total completed journeys: ${c}
Average completion rate of ${Math.round((c/t)*10000)/100}%
**Total: ${Stats.T}**
(${Stats.T - Stats.D} entries - ${Stats.D} deletions)
Verifications: ${Stats.V}
Disqualifications: ${Stats.DQ}
Pending: ${Stats.P}
----------------------------------${response}`)
}
module.exports = {
    run,
    Description
};