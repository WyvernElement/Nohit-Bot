const DiscordService = require("../../service/DiscordService");
const NohitService = require("../../service/NohitService.js");

const {parseForKeywords} = require("../../discord/argument_util");

const Description = "Prevents (or reallows) a journey to show up in the queue.";

async function run(message, args, client, user) {
    if (args.length === 0){
        return message.reply("Usage: `!ignorejourney <id>` or `!ignore <difficulty> <userid>`");
    }

    const parsed = parseForKeywords(message.guildId, args);
    
    let journey;
    if (parsed.num){
        journey = await NohitService.lookupJourney(message.guildId, parsed.num);
        if (!journey){
            return message.reply("That's not a valid nohit ID.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("Difficulty misspelling.");
        }
        if (!parsed.ID){
            return message.reply("You need to provide a user ID.");
        }
        journey = await NohitService.lookupByUser(message.guildId, parsed.ID, parsed.Diff);
        if (!journey){
            return message.reply("That journey does not exist.");
        }
    }

    

    const ignored = await NohitService.ignoreJourney(message.guildId, journey.ID);
    if (!ignored){
        return message.reply("Sorry, doll, but there's no completed journey of those identifiers to (un)ignore.")
    }
    
    return message.reply(`Journey **[${journey.ID}] <@${journey.UserID}>** on **${journey.Difficulty}** ${ignored.Ignored ? "ignored!" : "unignored!"}`);
}

module.exports = {
    run,
    Description
};
