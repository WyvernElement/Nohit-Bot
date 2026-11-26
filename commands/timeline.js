const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");
const {parseForKeywords} = require("../discord/argument_util");
const {v, dq} = require("../discord/emoji_util");

const Description = "Displays a journey in the order its nohits were submitted in."; 

function verificationEmoji(nohit){
    if (nohit.Verification === "Pending"){
        return ":question:";
    }
    if (nohit.Verification === "Verified"){
        return v;
    }
    return dq;
}

async function nohitsInSubmissionOrder(guildId, ids){
    const nohits = [];
    for (const id of ids){
        const nohit = await NohitService.lookup(guildId, id);
        nohits.push(nohit);
    }
    nohits.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
    return nohits;
}

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply( "Usage: `!timeline <id>` or `!timeline <difficulty> <user>`.\nExample: `!timeline 101`, `!t d 1233943368426328094`")
    }

    const parsed = parseForKeywords(message.guildId, args);

    let journey;
    if (parsed.num){
        journey = await NohitService.lookupJourney(message.guildId, parsed.num)
        if (!journey){
            return message.reply("That ID isn't any good, try again.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("Try again, love. You're not making sense here.");
        }
        journey = await NohitService.lookupByUser(message.guildId, parsed.ID ?? message.author.id, parsed.Diff);
        if (!journey){
            return message.reply(`${parsed.ID ? "That user hasn't" : "You haven't"} submitted any nohits for that difficulty.`);
        }
    }
    let response = `**__${await DiscordService.getDisplayName(journey.UserID, message.guild.id)} on ${journey.Difficulty}__**
ID: ${journey.ID}${journey.Playlist ? "\nPlaylist: <" + journey.Playlist + ">" : ""}
${v} = Verified
${dq} = Disqualified, needs redo
:question: = Submitted, yet to be reviewed\n`;

    const resolved = NohitService.resolveDifficulty(message.guildId, journey.Difficulty);
    const difficulty = resolved ? resolved.base : NohitService.findDifficulty(message.guildId, journey.Difficulty);

    for (const nohit of await nohitsInSubmissionOrder(message.guildId, journey.NohitIDs)){
        const [year, month, day] = nohit.Timestamp.slice(0, 10).split('-');
        const formattedDate = `${month}/${day}/${year}`;
        response += `\n${nohit.ID} - ${nohit.Boss} - ${verificationEmoji(nohit)} - *${formattedDate}*`;
    }

    if (journey.SpecialIDs?.length){
        response += "\n\n**__Special Nohits__**";
        for (const nohit of await nohitsInSubmissionOrder(message.guildId, journey.SpecialIDs)){
            const [year, month, day] = nohit.Timestamp.slice(0, 10).split('-');
            const formattedDate = `${month}/${day}/${year}`;
            response += `\n${nohit.ID} - ${nohit.Boss} - ${verificationEmoji(nohit)} - *${formattedDate}*`;
        }
    }

    if (journey.Comment.length > 0){
        response += `\n\n**__Commentary:__**\n"${journey.Comment}"`;
    }

    const remaining = (difficulty.bosses.length - journey.getTotal()) + journey.DQ;
    response += `\n\n**__Totals:__**
${journey.DQ} DQs, ${journey.Pending} pending, and ${journey.V} verified nohits.
**${(remaining === 0) ?  "This nohit journey is completed!!" : `${remaining} nohit${remaining === 1 ? "" : "s"} remain.`}**`;

    const messages = [];
    while (response.length > 2000){
        const index = response.lastIndexOf("\n", 2000)
        messages.push(response.slice(0, index));
        response = response.slice(index);
    }
    messages.push(response);

    message.reply(messages.shift())
    for (const response of messages){
        message.channel.send(response);
    }
}

module.exports = {
    run,
    Description
}