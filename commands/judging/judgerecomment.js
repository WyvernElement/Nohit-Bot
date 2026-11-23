const DiscordService = require('../../service/DiscordService.js');
const NohitService = require("../../service/NohitService.js");
const {parseForKeywords} = require("../../discord/argument_util");

async function run(message, args, client, user) {
    if (args.length === 0){
        return message.reply("Usage: `!judgerecomment <id> <comment>` or `!jr <boss> <difficulty> <userid> <comment>`.\nExample: `!judgerecomment 11578 *sorry, you were 5 seconds under mnl.` or `!jr d ks 1233943368426328094 actually this isn't bad i take it back`");
    }

    const parsed = parseForKeywords(message.guildId, args);
    const comment = args.join(" ");
    let recommentResult;
    if (parsed.num){
        recommentResult = await NohitService.judgeRecommentID(message.guildId, parsed.num, comment, message.author.id);
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
        recommentResult = await NohitService.judgeRecomment(message.guildId, parsed.ID, parsed.Diff, parsed.Boss, comment, message.author.id);

    }
    switch (recommentResult){
        case null: return message.reply("That nohit does not exist!");
        case "Pending": return message.reply("That nohit hasn't even been verified yet! Go review it or something.");
        case "Not Allowed": return message.reply("You didn't review that nohit, lol!");
        default: {
            const msg = await DiscordService.findDirectMessage(recommentResult.userId, recommentResult.id);
            const newmsg = String(msg.content.slice(0, msg.content.indexOf('\n') + 1)) + `${(comment.length === 0) ? "No comment was left." : `They also left a comment for you: "${comment}"`}`
            await DiscordService.editMessage(msg, newmsg);
            return message.reply("Judge comment successfully rewritten. DM message updated.");
        }
    }
}

module.exports = {
    run,
};
