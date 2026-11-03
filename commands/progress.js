const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");
const { Nohit } = require("../objects/Nohit.js");

async function run(message, args, client){
    const id = args[0];
    const iid = args[1] ?? message.author.id;
    const journey = await NohitService.lookupJourney(id) ?? await NohitService.lookupByUser(id, iid) ?? await NohitService.lookupByUser(iid, id);
    if (NohitService.resolveDifficulty(id) === undefined && NohitService.resolveDifficulty(iid) === undefined){
        return message.reply("Try again, love. You're not making sense here.");
    }
    else if (journey === undefined){
        return message.reply(`${iid === message.author.id ? "You haven't": "That user hasn't"} submitted any nohits for that difficulty.`);
    }
    else{
        let response = `**__${await DiscordService.getDisplayName(journey.UserID, message.guild.id)} on ${journey.Difficulty}__**${journey.Playlist ? "\nPlaylist: " + journey.Playlist : ""}
:V_: = Verified
:dq: = Disqualied, needs redo
:question: = Submitted, yet to be reviewed\n\n`;

        for (const id of journey.NohitIDs){
            const nohit = await NohitService.lookup(id);
            const emoji = nohit.Verification === "Pending" ? ':question:' : nohit.Verification === "Verified" ? ":V_:" : ":dq:";
            response += `\n${id} - ${nohit.Boss} - ${emoji}`;
        }

        const difficulty = await NohitService.findDifficulty(journey.Difficulty);
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