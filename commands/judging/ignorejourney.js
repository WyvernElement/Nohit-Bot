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
    }
    else{
        journey = await NohitService.lookupByUser(message.guildId, parsed.ID, parsed.Diff);
    }

    let nohit;{
        if (parsed.num){
            nohit = await NohitService.lookup(message.guildId, parsed.num);
        }
        else{
            nohit = await NohitService.lookupByBoss(message.guildId, parsed.ID, parsed.Diff, parsed.Boss);
        }
    }
    
    if (!nohit && !journey){
        if (!parsed.num){
            return message.reply("That's not a valid journey/nohit ID!");
        }
        if (!parsed.Diff){
            return message.reply("Difficulty misspelling.");
        }
        if (!parsed.ID){
            return message.reply("You need to provide a user ID.");
        }
        if (parsed.Boss){
            return message.reply("That nohit does not exist.");
        }
        return message.reply("That journey does not exist.");
    }

    if (nohit && journey){
        const checkJ = await NohitService.checkJourneyCompletion(message.guildId, journey.ID, false);
        const checkN = await NohitService.checkJourneyCompletion(message.guildId, nohit.ID, true);
        if (checkJ){
            if (checkN){
                if (parsed.Boss){
                    journey = undefined;
                }
                else if (parsed.Diff){
                    nohit = undefined;
                }
                else{
                    return message.reply("Okay, first off I'm amazed this happened. There is a journey in the queue that has the same ID as a nohit also in the queue. Kinda crazy. Anyways, you'll need to be very particular here: to ignore the __JOURNEY__, provide the ID and the difficulty (so, like `1109 d`), and to ignore the __NOHIT__, provide the ID and the boss (so, like `12504 scal`).");
                }
            }
            else{
                nohit = undefined;
            }
        }
        else{
            journey = undefined;
        }
    }


    const ignored = await NohitService.ignoreJourney(message.guildId, journey?.ID ?? nohit.ID, nohit != undefined);
    if (!ignored){
        return message.reply("Sorry, doll, but there's no completed journey or nohit of those identifiers to (un)ignore.")
    }
    
    return message.reply(`${(journey) ? "Journey" : "Nohit"} **[${journey?.ID ?? nohit.ID}]** <@${journey?.UserID ?? nohit.UserID}> ${(nohit) ? `**${nohit.Boss}** ` : ""}on **${journey?.Difficulty ?? nohit.Difficulty}** ${ignored.Ignored ? "ignored!" : "unignored!"}`);
}

module.exports = {
    run,
    Description
};
