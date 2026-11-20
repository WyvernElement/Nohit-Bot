const NohitService = require("../service/NohitService.js");



async function run(message, args, client, user){
    const {Stats, Diffs, Bosses} = await NohitService.stats(message.guildId);
    let c = 0.0;
    let t = 0.0;
    for (const journey of NohitService.nohitData.journeys.get(message.guildId).values()){
        //console.log(journey.V);
        if (journey.Completed){
            c++;
        }
        t++;
    }

    let response = "";
    for (const [diff, item] of Diffs){
        if (diff && diff != "Deleted"){
            response += `\n**[${diff}]** - ${item.T}`;
        }
    }
    return message.reply(`Average completion rate of ${c} ${t} ${Math.round((c/t)*10000)/100}%
Verifications: ${Stats.V}
Disqualifications: ${Stats.DQ}
Pending: ${Stats.P}
Deleted: ${Stats.D}
**Total: ${Stats.T}**
----------------------------------${response}`)
}
module.exports = {run};