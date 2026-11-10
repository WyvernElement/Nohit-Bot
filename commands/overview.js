const { MessageFlags } = require("discord.js");
const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0] ?? message.author.id;
    const user = await NohitService.userData.getUser(message.guildId, id);
    if(user === undefined){
        return message.reply("Who're you after? That's not a person.");
    }
    else{
        let response = `### Overview for ${await DiscordService.getDisplayName(id, message.guild.id)}`;
        let total = 0;
        let v = 0;
        let dq = 0;
        await NohitService.updateJourneys(message.guildId);
        for (const [difficulty, id] of user.OwnedNohits){
            const journey = await NohitService.lookupJourney(message.guildId, id);
            total += journey.getTotal();
            v += journey.V;
            dq += journey.DQ;
        }
        if(total === 0){
            return message.reply("This user hasn't submitted any nohits. They should be ashamed!")
        }
        response += `\nThis user has submitted **__${total}__** total nohits, out of which:
**${v}** have been verified,
**${dq}** have been disqualified,
and **${total - v - dq}** are still pending review.`;
        for (const [difficulty, id] of user.OwnedNohits){
            const journey = await NohitService.lookupJourney(message.guildId, id);
            response += `\n### **${difficulty} - ${id}:**`
            if (journey.V > 0){
                response += `\nVerified: ${journey.V}`;
            }
            if (journey.DQ > 0){
                response += `\nDisqualified: ${journey.DQ}`;
            }
            if (journey.Pending > 0){
                response += `\nPending: ${journey.Pending}`;
            }
            for (const special of journey.SpecialIDs){
                const nohit = await NohitService.lookup(message.guildId, special);
                const emoji = nohit.Verification === "Pending" ? ':question:' : nohit.Verification === "Verified" ? ":V_:" : ":dq:";
                response += `\n[${nohit.Boss}](<${nohit.Url}>) - ${emoji}`;
            }
            const link = journey.Playlist;
            if (link != undefined){
                response += `\n[Playlist](<${link}>)`;
            }
        }
        return message.reply(response, [MessageFlags.SuppressEmbeds]);
    }
}

module.exports = {
    run
}