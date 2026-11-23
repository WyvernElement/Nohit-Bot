const DiscordService = require("../service/DiscordService.js");
const NohitService = require("../service/NohitService.js");
const ModerationService = require("../service/ModerationService");

const { buildNohitEmbed } = require("../discord/embed_builder.js");
const { parseForKeywords } = require("../discord/argument_util");

const Description = "Forwards a request for review of a specific nohit to the judges. Don't be shy! They don't bite, I promise!";

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply("Usage: `!requestreview <id>` or `!requestreview <boss> <difficulty>`.\nExample: `!requestreview 12504`, `!rr s-d scal`");
    }

    const parsed = parseForKeywords(message.guildId, args);
    let nohit;
    if (parsed.num){
        nohit = await NohitService.lookup(message.guildId, parsed.num);
        if (!nohit){
            return message.reply("That isn't a usable nohit ID!");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("What... difficulty, exactly?");
        }
        if (!parsed.Boss){
            return message.reply("Check your boss submission and try again.");
        }
        nohit = await NohitService.lookupByBoss(message.guildId, message.author.id, parsed.Diff, parsed.Boss.name);
        if (!nohit){
            return message.reply("Are you asking for a review on a boss you haven't done yet?");
        }
    }
    if (nohit.UserComment === "Deleted" && nohit.UserID === 0){
        return message.reply("Really? Why would- yeah, that's not happening.");
    }
    if (message.author.id != nohit.UserID){
        return message.reply("Lovely thought, but no, you can't submit someone else's nohits for review. At least I'm going to assume you're doing it out of benevolence. If not... well, I'd have to kill you.")
    }
    if (await NohitService.lookupReview(message.guildId, nohit.ID)){
        return message.reply("Please be patient. The judges will get to it. If it's really been a while, ask them about it.");
    }

    let j = undefined;
    for (const judge of NohitService.userData.judges.get(message.guildId).values()){
        if (judge.JudgeID === parsed.ID){
            j = judge.JudgeID;
            break;
        }
        if (args.length > 0 && (judge.DefaultAlias.toLowerCase() === args[0].toLowerCase() || judge.Aliases.map(element => element.toLowerCase()).includes(args[0].toLowerCase()))){
            args.shift();
            j = judge.JudgeID;
            break;
        }
    }

    const config = await ModerationService.getConfig(message.guildId);
    const channelId = config.getReview(parsed.DiffObj.bias).ID;
    if (!channelId){
        return message.reply("Unfortunately, I can't submit your request, as that difficulty is not being judged.");
    }

    const msg = `**[!]** <@${message.author.id}> has requested a ${(nohit.Verification != "Pending") ? "re-" : ""}review for their ${parsed.Boss.textName} nohit on ${parsed.Diff}! ${(j)
        ? `<@${j}>, you were specifically requested to judge this nohit.`
        : "Whenever a judge is available, a review would be appreciated."
    } ${(args.length === 0)
        ? "They, uh, didn't leave any reasoning."
        : `Their reasoning reads: "${args.join(" ")}"`}`;

    const replyPayload = await buildNohitEmbed(nohit, message.guildId);
    const rr = await DiscordService.sendMessageInChannel(msg, channelId, [replyPayload]);
    NohitService.addReview(message.guildId, nohit.ID, rr.id, parsed.DiffObj.bias);
    
    return message.reply(`Your request has been submitted to ${(j) ? await DiscordService.getDisplayName(j, message.guildId) : "the judges"}!`);

}

module.exports = {
    run,
    Description
}