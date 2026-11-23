const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");
const {parseForKeywords} = require("../discord/argument_util");

const Description = "Shows what nohits a journey given by ID or difficulty and user is missing.";

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply( "Usage: `!remaining <id>` or `!progress <difficulty> <user>`.\nExample: `!remaining 101`, `!rem d 1233943368426328094`")
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
    if (!parsed.DiffObj){
        const resolved = NohitService.resolveDifficulty(message.guildId, journey.Difficulty);
        parsed.DiffObj = resolved ? resolved.base : NohitService.findDifficulty(message.guildId, journey.Difficulty);
    }
    let bosses = parsed.DiffObj.bosses;
    bosses.sort((a, b) => a.progressionOrder - b.progressionOrder);
    let bossNames = [];
    for(const boss of bosses) {
        bossNames.push(boss.textName);
    }
    for(const nohitID of journey.NohitIDs){
        let nohit = await NohitService.lookup(message.guildId, nohitID);
        const index = bossNames.indexOf(nohit.Boss);
        if(index > -1){
            bossNames.splice(index, 1);
        }
    }
    let msg = `__Remaining nohits for **${await DiscordService.getDisplayName(journey.UserID)}** on **${journey.Difficulty}** mode__\n\n`;
    for(const boss of bossNames){
        msg += boss + "\n";
    }
    msg += `\n**${bossNames.length}** nohits remaining. Best of luck :salute:`
    return message.reply(msg);
}
module.exports = {
    run,
    Description
};