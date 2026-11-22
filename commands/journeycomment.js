const NohitService = require("../service/NohitService.js");
const {parseForKeywords} = require("../discord/argument_util");

const Description = "Allows you to add, change, or remove your comment for a journey.";

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply("Usage: `!journeycomment <id OR difficulty> <comment (optional)>`\nExample: `!journeycomment 232 super happy with how I did this time :)` or `!jc d Let it be known that I HATE destroyer.`");
    }

    const parsed = parseForKeywords(message.guildId, args);

    await NohitService.updateJourneys(message.guildId);
    let journey;
    if (parsed.num){
        journey = await NohitService.lookupJourney(message.guildId, parsed.num)
        if (!journey){
            return message.reply("There's no journey to be found with that ID, dear.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("Uh, what difficulty?");
        }
        journey = await NohitService.lookupByUser(message.guildId, message.author.id, parsed.Diff);
        if (!journey){
            return message.reply("Ahem - you haven't submitted anything on that difficulty.");
        }
    }
    if (journey.UserID != message.author.id){
        return message.reply("That one isn't yours. Try again.")
    }

    const comment = args.join(" ");
    NohitService.journeyComment(message.guildId, journey, comment);
    return message.reply((comment.length === 0) ? "Journey comment removed!" : "journey comment rewritten!");
}

module.exports = {
    run,
    Description
}
