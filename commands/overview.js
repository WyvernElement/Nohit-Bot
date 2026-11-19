const { buildOverviewEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client, user){
    const caller = await NohitService.userData.getUser(message.guildId, args[0]) ?? user;
    if(caller === undefined){
        return message.reply("Who're you after? That's not a person.");
    }
    else{
        await NohitService.updateJourneys(message.guildId);
        
        const replyPayload = await buildOverviewEmbed(message.guildId, caller);
        return message.reply({embeds: [replyPayload]});
    }
}

module.exports = {
    run
}