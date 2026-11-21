const DiscordService = require("../service/DiscordService.js");
const NohitService = require("../service/NohitService.js");
const ModerationService = require("../service/ModerationService");

const { parseForKeywords } = require("../discord/argument_util");

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply("Usage: `!requestreview <id>` or `!requestreview <boss> <difficulty>`.\nExample: `!requestreview 12504`, `!rr s-d scal`");
    }
    
    const isJudge = NohitService.checkJudge(message.guildId, message.author.id);

    const parsed = parseForKeywords(message.guildId, args);
    let nohit;
    if (parsed.num){
        nohit = await NohitService.lookup(message.guildId, parsed.num);
        if (!nohit){
            return message.reply("That isn't a valid nohit ID.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("Sorry, I don't recognize that difficulty.");
        }
        if (!parsed.Boss){
            return message.reply("Check your boss submission and try again.");
        }
        nohit = await NohitService.lookupByBoss(message.guildId, parsed.ID ?? message.author.id, parsed.Diff, parsed.Boss.name);
        if (!nohit){
            if (!isJudge){
                return message.reply("Removing a request for a nohit that doesn't even exist. Amazing.");
            }
            else{
                return message.reply("Sorry, dear, that nohit doesn't seem to exist. Did you forge the user ID?");
            }
        }
    }
    if (!isJudge && nohit.UserID != message.author.id){
        return message.reply("You can't do that. Stop trying.");
    }
    
    const config = await ModerationService.getConfig(message.guildId);
    const channelId = config.getReview(parsed.DiffObj.bias);
    if (!channelId){
        return message.reply("Removing a request for a nohit that can't even be reviewed. How do you do it?");
    }
    
    const messageId = await NohitService.lookupReview(message.guildId, nohit.ID);
    if (!messageId){
        if (!isJudge){
            return message.reply("You never put that nohit up for review.");
        }
        else{
            return message.reply("Hm, seems like you put in the wrong identifiers... that nohit isn't up for review.");
        }
    }
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);
    msg.delete();
    NohitService.nohitData.rrNohits.get(message.guildId).delete(nohit.ID);
    
    return message.reply(`Your request for review has been removed.`);

}

module.exports = {
    run
}