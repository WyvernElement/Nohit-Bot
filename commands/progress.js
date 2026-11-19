const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");
const {v, dq} = require("../discord/emoji_util");

function verificationEmoji(nohit){
    if (nohit.Verification === "Pending"){
        return ":question:";
    }
    if (nohit.Verification === "Verified"){
        return v;
    }
    return dq;
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
**${remaining} nohit${remaining === 1 ? "" : "s"} remain.**`;

        return message.reply(response);
    }
}

module.exports = {
    run
}