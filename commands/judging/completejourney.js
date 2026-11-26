const NohitService = require("../../service/NohitService.js");

const {parseForKeywords} = require("../../discord/argument_util");

const Description = "Deletes a nohit. Do **__NOT__** use this without proper discretion. It is restricted to judges-only specifically for this reason.";

async function run(message, args, client, user) {
    if (args.length === 0){
        return message.reply("Usage: `!completejourney <id>` or `!completejourney <difficulty> <userid>`");
    }

    const parsed = parseForKeywords(message.guildId, args);

    let journey;
    if (parsed.num){
        journey = await NohitService.lookup(message.guildId, parsed.num);
        if (!journey){
            return message.reply("That's not a valid journey ID.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("You typed the difficulty wrong.");
        }
        if (!parsed.Boss){
            return message.reply("You typed the boss wrong.");
        }
        journey = await NohitService.lookupByBoss(message.guildId, parsed.ID ?? message.author.id, parsed.Diff, parsed.Boss.name);
        if (!journey){
            return message.reply("That journey does not exist.");
        }
    }
    
    journey.Finished = !journey.Finished; // need a way to communicate with the roles and stuff

    return message.reply(`Journey ${journey.ID} marked as ${journey.Finished
        ? "completed! The role will now be awarded."
        : "not completed. The role will be rescinded."}`);
}

module.exports = {
    run,
    Description
};
