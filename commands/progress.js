const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0];
    const iid = args[1] ?? message.author.id;
    const journey = await NohitService.lookupJourney(message.guildId, id) ?? await NohitService.lookupByUser(message.guildId, id, iid) ?? await NohitService.lookupByUser(message.guildId, iid, id);
    if (journey === undefined){
        if (NohitService.resolveDifficulty(message.guildId, id) === undefined && NohitService.resolveDifficulty(message.guildId, iid) === undefined){
        return message.reply("Try again, love. You're not making sense here.");
        }
        else{
            return message.reply(`${iid === message.author.id ? "You haven't": "That user hasn't"} submitted any nohits for that difficulty.`);
        }
    }
    else{
        let response = `**__${await DiscordService.getDisplayName(journey.UserID, message.guild.id)} on ${journey.Difficulty}__**${journey.Playlist ? "\nPlaylist: " + journey.Playlist : ""}
:V_: = Verified
:dq: = Disqualied, needs redo
:question: = Submitted, yet to be reviewed\n`;

        for (const id of journey.NohitIDs){
            const nohit = await NohitService.lookup(message.guildId, id);
            const emoji = nohit.Verification === "Pending" ? ':question:' : nohit.Verification === "Verified" ? ":V_:" : ":dq:";
            response += `\n${id} - ${nohit.Boss} - ${emoji}`;
        }

        const difficulty = await NohitService.findDifficulty(message.guildId, journey.Difficulty);
        const remaining = (/*difficulty.bosses.length*/ 44 - journey.Total) + journey.DQ;
        response += `\n\n**__Totals:__**
${journey.DQ} DQs, ${journey.Pending} pending, and ${journey.V} verified nohits.
**${remaining} nohit${remaining === 1 ? "" : "s"} remain.**`;

        return message.reply(response);
    }
}

module.exports = {
    run
}