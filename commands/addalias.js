const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const parsed = await parseArgs(message.guildId, args);
    if (parsed.badargs){
        return message.reply("Usage: `!addalias <boss identifier (no spaces)> <list of aliases>`\nExample: `!addalias KingSlime ks slimeking`");
    }
    if (parsed.duplicate.length === 0){
        if (args.length > 1) { args[args.length - 1] = `**and** ${args.at(-1)}` }
        return message.reply(`Aliases **${args.join((args.length > 2) ? ", " : " ")}** successfully added!`);
    }
    else{
        if (parsed.duplicate.length > 1) { parsed.duplicate[parsed.duplicate.length - 1] = `**and** ${parsed.duplicate.at(-1)}` }
        return message.reply(`Error: aliases **${parsed.duplicate.join((parsed.duplicate.length > 2) ? ", " : " ")}** already exist!`);
    }
}

async function parseArgs(guild, args){
    if (args.length < 2){
        return { badargs: true }
    }
    const bossName = args.shift().trim().toLowerCase();
    let duplicate = [];
    for (const a of args){
        const alias = a.trim().toLowerCase(); 
        if (NohitService.nohitData.getBoss(guild, alias) === bossName){
            duplicate.push(alias);
        }
        else {
            NohitService.nohitData.addAlias(guild, alias, bossName);
        }
    }
    return { duplicate };
}

module.exports = {
    run
}
