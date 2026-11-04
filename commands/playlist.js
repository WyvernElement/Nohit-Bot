const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    const id = args[0];
    const journey = await NohitService.lookupJourney(id) ?? await NohitService.lookupByUser(message.author.id, id);
    const acceptedLinks = ["https://youtu.be/", "https://www.youtube.com/", "https://youtube.com"]; // unsure if bilibili has playlists, I don't use it
    if(journey === undefined){
        return message.reply("Not... sure what you're looking for.");
    }
    else if(journey.UserID != message.author.id){
        return message.reply("Hey, now, that isn't yours!");
    }
    else{
        for (const link of acceptedLinks){
            if (args[1].startsWith(link)){
                journey.setPlaylist(args[1]);
                return message.reply("Playlist set!");
            }
        }
        return message.reply("What kind of link even is that? I've never seen it before.");
    }
}

module.exports = {
    run
}