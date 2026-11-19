const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");
const ModerationService = require("../service/ModerationService");
const DiscordService = require("../service/DiscordService");

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

function parseSubmitArgs(args) {
    if (args.length < 3 || args.length > 4) {
        return undefined;
    }
    const difficulty = args[0];
    const boss = args[1];
    const url = args[2];
    const comment = args.length === 4 ? args.slice(3).join(" ").trim() : "";
    if (!difficulty || !boss || !url) {
        return undefined;
    }
    return { difficulty, boss, url, comment };
}

async function run(message, args, client, user) {
    const config = await ModerationService.getConfig(message.guildId);
    if(message.channel.id !== config.submissionChannel){
        return message.reply(`This command can only be used in <#${config.submissionChannel}>!`);
    }

    const parsed = parseSubmitArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!submit <difficulty> <boss> <video url> [comment]` — one word per parameter, no spaces.\nExample: `!submit Death ks https://youtu.be/example first try`"
        );
    }

    if (!isAllowedVideoUrl(parsed.url)) {
        return message.reply("Video links must be from **YouTube** or **Bilibili**.");
    }

    const existing = await NohitService.lookupByBoss(
        message.guildId,
        message.author.id,
        parsed.difficulty,
        parsed.boss
    );

    const nohit = await NohitService.submit(
        message.guildId,
        message.author.id,
        parsed.difficulty,
        parsed.boss,
        parsed.url,
        parsed.comment
    );

    if (nohit === undefined) {
        return message.reply(
            "That submission didn't work — check the difficulty (and modifiers), boss name, and try again."
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
