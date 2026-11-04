const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0];
    const iid = args[1];
    const iiid = args[2] ?? message.author.id;
    const nohit = await NohitService.lookup(id) ?? await NohitService.lookupByBoss(id, iid, iiid) ?? await NohitService.lookupByBoss(iid, id, iiid) ?? await NohitService.lookupByBoss(id, iiid, iid) ?? await NohitService.lookupByBoss(iid, iiid, id) ?? await NohitService.lookupByBoss(iiid, id, iid)  ?? await NohitService.lookupByBoss(iiid, iid, id);
    if(nohit === undefined){
        if(iid === undefined){
            return message.reply("That's not a nohit ID!");
        }
        else{
            return message.reply("Yeah, I have no idea what you're on about.");
        }
    }
    else if(nohit.UserComment === "Deleted" && nohit.UserID === 0){
        if(id === '12504' && Math.random() < 0.1){
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