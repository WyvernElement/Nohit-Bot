const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client, user){
    const parsed = await parseArguments(message.guildId, args, message.author.id);
    if (parsed.error === "empty"){
        return message.reply("I can't work with nothing, c'mon.");
    }
    else if (parsed.error === "id"){
        return message.reply("That's not a nohit ID!");
    }
    else if (parsed.error === "complex"){
        return message.reply("Yeah, I have no idea what you're on about. Sorry.");
    }

    else if(parsed.UserComment === "Deleted" && parsed.UserID === 0){
        if(parsed.id === '12504' && Math.random() < 0.1){
            return message.reply(":12504:");
        }
        return message.reply("This nohit has been deleted.");
    }
    
    else{
        const replyPayload = await buildNohitEmbed(parsed, message.guild.id);
        return message.reply({embeds: [replyPayload]});
    }
}

async function parseArguments(guild, args, author){
    if (args.length < 1){
        return { error: "empty" };
    }

    let nohit = await NohitService.lookup(guild, args[0]);
    if (nohit){
        return nohit;
    }
    if (args.length === 1){
        return { error: "id" };
    }

    let id = author;
    let difficulty = args[0];
    let alias = args.slice(1).join(" ");
    nohit = await NohitService.lookupByBoss(guild, id, difficulty, alias);
    if (nohit){
        return nohit;
    }

    difficulty = args[args.length - 1];
    alias = args.slice(-args.length, -1).join(" ");
    nohit = await NohitService.lookupByBoss(guild, id, difficulty, alias);
    if (nohit){
        return nohit;
    }

    id = args[0];
    difficulty = args[1];
    alias = args.slice(2).join(" ");
    nohit = await NohitService.lookupByBoss(guild, id, difficulty, alias) ?? await NohitService.lookupByBoss(guild, difficulty, id, alias);
    if (nohit){
        return nohit;
    }
    id = args[args.length - 1];
    difficulty = args[args.length - 2];
    alias = args.slice(-args.length, -2).join(" ");
    nohit = await NohitService.lookupByBoss(guild, id, difficulty, alias) ?? await NohitService.lookupByBoss(guild, difficulty, id, alias);
    if (nohit){
        return nohit;
    }
    id = args[0];
    difficulty = args[args.length - 1];
    alias = args.slice(-args.length + 1, -1).join(" ");
    nohit = await NohitService.lookupByBoss(guild, id, difficulty, alias) ?? await NohitService.lookupByBoss(guild, difficulty, id, alias);
    if (nohit){
        return nohit;
    }

    return { error: "complex" };
}

module.exports = {
    run,
    parseArguments
}