const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

const {parseForKeywords} = require("../discord/argument_util");

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply("I can't work with nothing, c'mon.");
    }

    const parsed = parseForKeywords(message.guildId, args);
    let nohit;
    if (parsed.num){
        nohit = await NohitService.lookup(message.guildId, parsed.num);
        if (!nohit){
            return message.reply("That's not a valid nohit ID!");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("I dunno what that difficulty is, did you spell it right?");
        }
        if (!parsed.Boss){
            return message.reply("That's not a boss. Are you using an alias that doesn't exist?");
        }
        nohit = await NohitService.lookupByBoss(message.guildId, parsed.ID ?? message.author.id, parsed.Diff, parsed.Boss.name);
        if (!nohit){
            if (!parsed.ID){
                return message.reply("You haven't submitted anything for this boss lol");
            }
            else{
                return message.reply("That user hasn't submitted a nohit for this boss!");
            }
        }
    }

    if(nohit.UserComment === "Deleted" && nohit.UserID === 0){
        if(parsed.id === '12504' && Math.random() < 0.1){
            return message.reply(":12504:");
        }
        return message.reply("This nohit has been deleted.");
    }

    else{
        const replyPayload = await buildNohitEmbed(nohit, message.guild.id);
        return message.reply({embeds: [replyPayload]});
    }
}

module.exports = {
    run
}