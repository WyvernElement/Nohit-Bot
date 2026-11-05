const NohitService = require("../service/NohitService.js");

function parseCreateDifficultyArgs(args) {
    if (args.length < 2) {
        return undefined;
    }
    const base = NohitService.findDifficulty(args[0]);
    const modifiers = args.slice(1).map(mod => NohitService.findDifficulty(mod));
    if (base && modifiers) {
        return { base, modifiers };
    }
    return undefined;
}

async function run(message, args, client) {
    const parsed = parseCreateDifficultyArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!allowmodifier <base> <modifier(s)>`.\nExample: `!addmodifiers Death Shroomed Defiled` or `!addmodifier ceg d`"
        );
    }

    const result = [];
    for (const modifier of parsed.modifiers){
        if (parsed.base.allowedModifiers.includes(modifier.name) || modifier === undefined || !modifier.isModifier){
            result.push(false);
        }
        else{
            result.push(parsed.base.addModifier(modifier.name));
        }
    }

    let response = `**__${parsed.base.name}__**:`;
    for (let i = 0; i < parsed.modifiers.length; i++){
        response += result[i] ? `\n*${parsed.modifiers[i].name}* modifier successfully added.` : `\n**Failed to add ${parsed.modifiers[i].name}!**`
    }
    NohitService.nohitData.saveDifficulties();
    return message.reply(response);
}

module.exports = {
    run,
};
