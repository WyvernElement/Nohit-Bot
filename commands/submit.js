const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

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

async function run(message, args, client) {
    const parsed = parseSubmitArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!submit <difficulty> <boss> <video url> [comment]` — one word per field, no spaces.\nExample: `!submit Death ks https://youtu.be/example firsttry`"
        );
    }

    if (!isAllowedVideoUrl(parsed.url)) {
        return message.reply("Video links must be from **YouTube** or **Bilibili**.");
    }

    const existing = await NohitService.lookupByBoss(
        message.author.id,
        parsed.difficulty,
        parsed.boss
    );

    const nohit = await NohitService.submit(
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

    return message.reply({
        content: action,
        embeds: [replyPayload],
    });
}

module.exports = {
    run,
};
