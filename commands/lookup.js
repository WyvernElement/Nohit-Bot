const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0];
    const nohit = await NohitService.lookup(id);
    if(nohit === undefined){
        return message.reply("That isn't a nohit ID");
    }
    else if(nohit.UserComment === "Deleted" && nohit.UserID === 0){
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