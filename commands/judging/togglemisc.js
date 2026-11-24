const NohitService = require("../../service/NohitService.js");

const Description = "Determines whether or not a completed journey on the given difficulty appears in the misc queue.";

async function run(message, args, client, user) {
    if (args.length === 0) {
        return message.reply("Usage: `!togglemisc <difficulty>`.\nExample: `!togglemisc Empyreal`");
    }
    const parsed = NohitService.findDifficulty(message.guildId, args[0]);
    if (!parsed) {
        return message.reply("Usage: `!togglemisc <difficulty>`.\nExample: `!togglemisc Empyreal`");
    }

    parsed.toggleSpecial();
    NohitService.nohitData.saveDifficulties(message.guildId);

    if (parsed.special){
        return message.reply(`${parsed.name} is now special, and not in a good way.`);
    }
    return message.reply(`${parsed.name} is no longer aberrant! Hooray for the status quo!`);
}

module.exports = {
    run,
    Description
};
