const { buildHelpEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

const Description = "Displays a list of commands, what they're used for, and how to use them.";

async function run(message, args, client, user){
    const replyPayload = await buildHelpEmbed(NohitService.checkJudge(message.guildId, message.author.id));
    return message.reply({embeds: [replyPayload]});
}

module.exports = {
    run,
    Description
}