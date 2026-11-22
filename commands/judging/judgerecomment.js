const DiscordService = require('../../service/DiscordService.js');
const NohitService = require("../../service/NohitService.js");
const {parseForKeywords} = require("../../discord/argument_util");

const Description = "Adds, changes, or removes a judge comment on a given nohit.";

async function run(message, args, client, user) {
    if (args.length === 0){
        return message.reply("Usage: `!judgerecomment <id> <comment>` or `!jr <boss> <difficulty> <userid> <comment>`.\nExample: `!judgerecomment 11578 *sorry, you were 5 seconds under mnl.` or `!jr d ks 1233943368426328094 actually this isn't bad i take it back`");
    }

    const parsed = parseForKeywords(message.guildId, args);

    let nohit;
    if (parsed.num){
        nohit = await NohitService.lookup(message.guildId, parsed.num);
        if (!nohit){
            return message.reply("Not a valid nohit ID.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("Can't parse what difficulty you mean.");
        }
        if (!parsed.Boss){
            return message.reply("Uhhh... I got nothing. I think you put the boss info in wrong.");
        }
        if (!parsed.ID){
            return message.reply("Hey, uh... I can't find a nohit without a user ID. And it's not like you can judge your own nohits.");
        }
        nohit = await NohitService.lookupByBoss(message.guildId, parsed.ID, parsed.Diff, parsed.Boss.name);
        if (!nohit){
            return message.reply("That nohit doesn't exist. They probably didn't submit anything for it.");
        }
    }
    if (nohit.Verification === "Pending"){
        return message.reply("That one hasn't even been reviewed. Hey, if you want to go judge it, be my guest.");
    }
    if (nohit.JudgeID != message.author.id){
        return message.reply("You're not allowed to do that lol that's not your review");
    }

    const comment = args.join(" ");
    const channel = await DiscordService.getDM(nohit.UserID);
    const messages = await channel.messages.fetch({ limit: 100, cache: false });
    const msg = messages.find((msg) => msg.content.includes(nohit.ID));
    await msg.edit(String(msg.content.slice(0, msg.content.indexOf('\n') + 1)) + `${(comment.length === 0) ? "No comment was left." : `They also left a comment for you: "${comment}"`}`);
    nohit.JudgeComment = comment;
    NohitService.nohitData.saveNohits(message.guildId);
    return message.reply("Judge comment successfully rewritten. DM message updated.");
}

module.exports = {
    run,
    Description
};
