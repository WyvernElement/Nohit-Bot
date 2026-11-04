const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0];
    const iid = args[1];
    const comment = args.slice(1).join(" ");
    const nohit = await NohitService.lookup(id) ?? await NohitService.lookupByBoss(message.author.id, id, iid) ?? await NohitService.lookupByBoss(message.author.id, iid, id);
    if(nohit === undefined){
        return message.reply("That's not a nohit ID.");
    }
    else if(nohit.UserID != message.author.id){
        return message.reply("Hey, now, that isn't yours!");
    }
    else{
        nohit.UserComment = comment;
        return message.reply("Comment rewritten!");
    }
}

module.exports = {
    run
}