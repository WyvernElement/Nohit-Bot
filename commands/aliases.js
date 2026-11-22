const { buildAliasesEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

const Description = "Fetches a list of all currently accepted boss aliases for a specified difficulty.";

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply("Hey! Unfortunately, due to the number of potential aliases, we've decided to split them up by difficulty. Don't worry; aliases will of course work across difficulties!");
    }

    const parsed = await NohitService.resolveDifficulty(message.guildId, args.join("-"));
    if (!parsed){
        return message.reply("Couldn't quite get that, try again please.");
    }

    const embed = await buildAliasesEmbed(parsed, NohitService.nohitData.aliases.get(message.guildId));
    return message.reply({embeds: [embed]});
}

module.exports = {
    run,
    Description
}