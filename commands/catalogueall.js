const NohitService = require("../service/NohitService.js");
const {buildCatalogueEmbed} = require("../discord/embed_builder");

function parseSubmitArgs(args) {
    if (args.length < 2 || args.length > 3) {
        return undefined;
    }
    const difficulty = args[0];
    const boss = args[1];
    const count = args[2];
    if (!difficulty || !boss) {
        return undefined;
    }
    return { difficulty, boss, count };
}

async function run(message, args, client, user){
    const parsed = parseSubmitArgs(args);
    if (!parsed){
        return message.reply(
            "Usage: `!catalogueall <difficulty> <boss> <count (optional)>` — one word per field, no spaces.\nExample: `!catalogueall death KingSlime 10`"
        );
    }
    if(!parsed.count || parsed.count > 25){
        parsed.count = 5;
    }

    const catalogueData = await NohitService.catalogue(message.guildId, parsed.difficulty, parsed.boss, parsed.count, false);

    if(!catalogueData || catalogueData.length === 0){
        return message.reply("No nohits found!");
    }

    const replyPayload = await buildCatalogueEmbed(message.guildId, catalogueData, false);

    return message.reply({
        embeds: [replyPayload]
    });
}
module.exports = {run};