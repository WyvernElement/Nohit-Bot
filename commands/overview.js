const { buildOverviewEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0] ?? message.author.id;
    const user = await NohitService.userData.getUser(message.guildId, id);
    if(user === undefined){
        return message.reply("Who're you after? That's not a person.");
    }
    else{
        await NohitService.updateJourneys(message.guildId);
        
        const replyPayload = await buildOverviewEmbed(message.guildId, user);
        return message.reply({embeds: [replyPayload]});
    }
}

module.exports = {
    run
}