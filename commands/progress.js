const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");
const {parseForKeywords} = require("../discord/argument_util");
const {v, dq} = require("../discord/emoji_util");

const Description = "Displays a journey by ID or boss, difficulty, and user."; 

function verificationEmoji(nohit){
    if (nohit.Verification === "Pending"){
        return ":question:";
    }
    if (nohit.Verification === "Verified"){
        return "V"//v;
    }
    return "DQ"//dq;
}

function findBoss(difficulty, bossName){
    if (!difficulty?.bosses){
        return undefined;
    }
    return difficulty.bosses.find(boss => boss.name === bossName || boss.textName === bossName);
}

function progressionOrder(difficulty, bossName){
    const boss = findBoss(difficulty, bossName);
    const order = Number(boss?.progressionOrder);
    return Number.isFinite(order) ? order : Number.POSITIVE_INFINITY;
}

function compareNohits(difficulty, a, b){
    const orderDiff = progressionOrder(difficulty, a.Boss) - progressionOrder(difficulty, b.Boss);
    if (orderDiff !== 0){
        return orderDiff;
    }
    return Number(a.ID) - Number(b.ID);
}

async function nohitsInProgressionOrder(guildId, difficulty, ids){
    const nohits = [];
    for (const id of ids){
        nohits.push(await NohitService.lookup(guildId, id));
    }
    nohits.sort((a, b) => compareNohits(difficulty, a, b));
    return nohits;
}

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply( "Usage: `!progress <id>` or `!progress <difficulty> <user>`.\nExample: `!progress 101`, `!p d 1233943368426328094`")
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
ID: *${journey.ID}*${journey.Playlist ? "\nPlaylist: <" + journey.Playlist + ">" : ""}
:V_: = Verified
:dq: = Disqualified, needs redo
:question: = Submitted, yet to be reviewed\n`;

    await NohitService.updateJourneys(message.guildId);
    const resolved = NohitService.resolveDifficulty(message.guildId, journey.Difficulty);
    const difficulty = resolved ? resolved.base : NohitService.findDifficulty(message.guildId, journey.Difficulty);

    for (const nohit of await nohitsInProgressionOrder(message.guildId, difficulty, journey.NohitIDs)){
        response += `\n${nohit.ID} - ${nohit.Boss} - ${verificationEmoji(nohit)}`;
    }

    if (journey.SpecialIDs?.length){
        response += "\n";
        for (const nohit of await nohitsInProgressionOrder(message.guildId, difficulty, journey.SpecialIDs)){
            response += `\n${nohit.ID} - ${nohit.Boss} - ${verificationEmoji(nohit)}`;
        }
    }

    const remaining = (difficulty.bosses.length - journey.getTotal()) + journey.DQ;
    response += `\n\n**__Totals:__**
${journey.DQ} DQs, ${journey.Pending} pending, and ${journey.V} verified nohits.
**${(remaining === 0) ?  "This nohit journey is completed!!" : `${remaining} nohit${remaining === 1 ? "" : "s"} remain.`}**`;

    return message.reply(response);
}

module.exports = {
    run,
    Description
}