const { buildOverviewEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

const Description = "Displays a summary of all nohits the specified user has completed.";

async function run(message, args, client, user){
    const caller = NohitService.userData.users.get(message.guildId).get(args[0]) ?? user;
    if(caller === undefined){
        return message.reply("Who're you after? That's not a person.");
    }
    else{
        const replyPayload = await buildOverviewEmbed(message.guildId, caller);
        return message.reply({embeds: [replyPayload]});
    }
}

module.exports = {
    run,
    Description
}