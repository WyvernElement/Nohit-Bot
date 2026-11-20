const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");
const ModerationService = require("../service/ModerationService");
const DiscordService = require("../service/DiscordService");
const {parseForKeywords} = require("../discord/argument_util");

function isAllowedVideoUrl(rawUrl) {
    let url;
    try {
        const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        url = new URL(normalized);
    } catch {
        return false;
    }
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
        return true;
    }
    if (host.endsWith(".youtube.com")) {
        return true;
    }
    if (host === "bilibili.com" || host === "b23.tv" || host.endsWith(".bilibili.com")) {
        return true;
    }
    return false;
}

async function run(message, args, client, user) {
    const config = await ModerationService.getConfig(message.guildId);
    if(message.channel.id !== config.submissionChannel){
        return message.reply(`This command can only be used in <#${config.submissionChannel}>!`);
    }
    if (args.length === 0) {
        return message.reply("Usage: `!submit <difficulty> <boss> <video url> [comment]` — one word per parameter, no spaces.\nExample: `!submit Death ks https://youtu.be/example first try`");
    }

    const parsed = parseForKeywords(message.guildId, args);

    if (!parsed.Diff){
        return message.reply("You typed the difficulty wrong.");
    }
    if (!parsed.Boss){
        return message.reply("That's not a valid boss name!");
    }
    
    const url = args.shift();
    if (!url){
        return message.reply("You need to submit a video link as well!");
    }

    if (!isAllowedVideoUrl(url)) {
        return message.reply("Video links must be from **YouTube** or **Bilibili**.");
    }

    const existing = await NohitService.lookupByBoss(
        message.guildId,
        message.author.id,
        parsed.Diff,
        parsed.Boss.name
    );

    const nohit = await NohitService.submit(
        message.guildId,
        message.author.id,
        parsed.Diff,
        parsed.Boss.name,
        url,
        args.join(" ")
    );

    if (nohit === undefined) {
        return message.reply(
            "That submission didn't work. I'd tell you to double check the arguments you gave, but I honestly have no idea what the issue could be either."
        );
    }

    const replyPayload = await buildNohitEmbed(nohit, message.guild?.id);
    const action = existing
        ? `Resubmitted nohit **#${nohit.ID}** (${nohit.Boss} on ${nohit.Difficulty}). Verification was reset to Pending.`
        : `Submitted nohit **#${nohit.ID}** (${nohit.Boss} on ${nohit.Difficulty}).`;

    if(config.submissionLogChannel){
        const journey = await NohitService.lookupByUser(message.guildId,  nohit.UserID, nohit.Difficulty);
        const resolved = NohitService.resolveDifficulty(message.guildId, journey.Difficulty);
        const difficulty = resolved ? resolved.base : NohitService.findDifficulty(message.guildId, journey.Difficulty);
        const remain = (difficulty.bosses.length - journey.getTotal()) + journey.DQ;

        const msg = `\[${nohit.ID}\] <@${nohit.UserID}> has submitted a new nohit for **${nohit.Boss}** on **${nohit.Difficulty}** mode! ${resolveLogString(remain, nohit.Difficulty)}`;

        await DiscordService.sendMessageInChannel(msg, config.submissionLogChannel);
    }

    return message.reply({
        content: action,
        embeds: [replyPayload],
    });
}

function resolveLogString(remaining, difficultyText){
    switch(remaining){
        case 0: return `This was their final nohit on ${difficultyText}!!`;
        case 1: return `They have 1 nohit remaining!!`;
        default: return `They have ${remaining} nohits remaining!!`
    }
}

module.exports = {
    run,
};
