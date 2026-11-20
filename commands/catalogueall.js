const NohitService = require("../service/NohitService.js");
const {buildCatalogueEmbed} = require("../discord/embed_builder");
const {parseForKeywords} = require("../discord/argument_util");

async function run(message, args, client, user){
    if (args.length === 0){
        if (Math.random() < 0.25){
            return message.reply(":cat:");
        }
        return message.reply(
            "Usage: `!catalogue <difficulty> <boss> <count (optional)>` — one word per field, no spaces.\nExample: `!catalogue death KingSlime 10`"
        );
    }

    const parsed = parseForKeywords(message.guildId, args);
    
    if (!parsed.Diff){
        return message.reply("You'll have to be more specific than that.");
    }
    if (!parsed.Boss){
        return message.reply("I think you spelled the name wrong.");
    }

    parsed.num = (parsed.num > 25) ? 25 : (parsed.num < 5) ? 5 : parsed.num ?? 5;
    const catalogueData = await NohitService.catalogue(message.guildId, parsed.Diff, parsed.Boss.name, parsed.num, false);

    if(!catalogueData || catalogueData.length === 0){
        return message.reply("No nohits found! Honestly, that's impressive. Funny you were able to find that.");
    }

    const replyPayload = await buildCatalogueEmbed(message.guildId, catalogueData, false);

    return message.reply({
        embeds: [replyPayload]
    });
}
module.exports = {run};