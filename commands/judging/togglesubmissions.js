const NohitService = require("../../service/NohitService.js");

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
    if (args.length === 0){
        return message.reply("Usage: `!toggle <difficulties>`.\nExample: `!toggle Death` or `!ts ceg smg lmg`");
    }
    const fails = [];
    const enable = [];
    const disable = [];
    for (const item of args){
        const resolved = NohitService.resolveDifficulty(message.guildId, item);
        if (!resolved){
            fails.push(item);
        }
        else{
            const bool = !resolved.base.isSubmittable
            if (bool){
                enable.push(item);
            }
            else{
                disable.push(item);
            }
            resolved.base.isSubmittable = bool;
        }
    }

    NohitService.nohitData.saveDifficulties(message.guildId);

    let response = "";
    if (enable.length > 0){
        for (let i = 0; i < enable.length; i++){
            enable[i] = "**" + enable[i] + "**";
        }
        if (enable.length > 1){
            enable[enable.length - 1] = "and " + enable.at(-1);
        }
        response += `\nTurned submissions **on** for ${(enable.length < 2) ? enable.join(" ") : enable.join(", ")}.`;
    }
    if (disable.length > 0){
        for (let i = 0; i < disable.length; i++){
            disable[i] = "**" + disable[i] + "**";
        }
        if (disable.length > 1){
            disable[disable.length - 1] = "and " + disable.at(-1);
        }
        response += `\nTurned submissions **off** for ${(disable.length < 2) ? disable.join(" ") : disable.join(", ")}.`;
    }
    if (fails.length > 0){
        if (fails.length > 1){
            fails[fails.length - 1] = "or " + fails.at(-1);
        }
        response += `\n__**Could not resolve ${(fails.length < 2) ? fails.join(" ") : fails.join(", ")}.**__`;
    }

    return message.reply(response);
}

module.exports = {
    run,
};
