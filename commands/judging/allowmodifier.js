const NohitService = require("../../service/NohitService.js");

const Description = "Allows a given difficulty to recognize a given list of modifiers. Do **__NOT__** use this unless all the judges are in agreement.";

function parseCreateDifficultyArgs(guild, args) {
    if (args.length < 2) {
        return undefined;
    }
    const base = NohitService.findDifficulty(guild, args[0]);
    const modifiers = args.slice(1).map(mod => NohitService.findDifficulty(guild, mod));
    if (base && modifiers) {
        return { base, modifiers };
    }
    return undefined;
}

async function run(message, args, client, user) {
    const parsed = parseCreateDifficultyArgs(message.guildId, args);
    if (!parsed) {
        return message.reply(
            "Usage: `!allowmodifier <base> <modifier(s)>`.\nExample: `!addmodifiers Death Shroomed Defiled` or `!addmodifier ceg d`"
        );
    }

    const result = await NohitService.addModifiers(message.guildId, parsed.base, parsed.modifiers);
    let response = `**__${parsed.base.name}__**:`;
    for (let i = 0; i < parsed.modifiers.length; i++){
        response += result[i] ? `\n*${parsed.modifiers[i].name}* modifier successfully added.` : `\n**Failed to add ${parsed.modifiers[i] ? parsed.modifiers[i].name : args[i + 1]}!**`
    }
    return message.reply(response);
}

module.exports = {
    run,
    Description
};
