const NohitService = require("../../service/NohitService.js");

async function run(message, args, client) {
    const parsed = await parseArgs(message.guildId, args, message.author.id);

    if (parsed.missing){
        return message.reply("Usage: `!judgerecomment <id **OR** nohit information> <new comment>`.\nExample: `!judgerecomment 12504 Hey, buddy.` or `!jr 874464051697172492 i sg not watching too long`")
    }
    if (parsed.id){
        return message.reply("Nohit ID not recognized!");
    }
    if (parsed.complex){
        return message.reply("Uhhh... I got nothing. You put the boss info in wrong.");
    }
    if (parsed.wrong){
        return message.reply("You're not allowed to do that lol that's not your review");
    }

    const idOnly = await NohitService.lookup(message.guildId, args[0]) ?? false;

    parsed.JudgeComment = args.slice((!idOnly) ? 3 : 1, args.length).join(" ");
    return message.reply("Judge comment successfully rewritten.");
}

async function parseArgs(guild, args, author){
    if (args.length === 0){
        return { missing: true };
    }

    const complexLookup = require(`../lookup.js`);
    const nohit = await complexLookup.parseArguments(guild, args.slice(0,3), undefined);

    if (nohit.error === "complex"){
        return { complex: true };
    }
    if (nohit === undefined && Number(args[0]) != NaN){
        return { id: true };
    }
    if (nohit.JudgeID != author){
        return { wrong: true };
    }
    return nohit;
}

module.exports = {
    run,
};
