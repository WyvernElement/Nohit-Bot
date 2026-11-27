const moderation = require("../../service/ModerationService.js");
const DiscordService = require("../../service/DiscordService.js");
const NohitService = require("../../service/NohitService.js");

function parseChannel(value) {
    if (!value) {
        return undefined;
    }
    const mention = String(value).match(/^<#(\d+)>$/);
    if (mention) {
        return mention[1];
    }
    if (/^\d+$/.test(value)) {
        return value;
    }
    return undefined;
}

function parseConfigArgs(args) {
    const bias = args[0].toLowerCase();
    const reviewChannel = parseChannel(args[1]);
    if (!bias) {
        return undefined;
    }
    return { bias, reviewChannel };
}

async function run(message, args, client, user) {
    const parsed = parseConfigArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!addreviewchannel <bias> <reviewchannel>`\nExample: `!arc fargos #fargo-nohit-review`"
        );
    }

    const existing = await moderation.getReview(message.guildId, parsed.bias);
    if (existing && parsed.reviewChannel){
        DiscordService.deleteMessageInChannel(existing.ID, existing.Queue);
        DiscordService.deleteMessageInChannel(existing.ID, existing.RR);
    }

    const rrMsg = await DiscordService.sendMessageInChannel(await NohitService.getReviewsComment(message.guildId, parsed.bias), parsed.reviewChannel);
    rrMsg.pin();
    const qMsg = await DiscordService.sendMessageInChannel(`Temporary queue placeholder for ${parsed.bias}, still trying to think of how to handle updating this`, parsed.reviewChannel);
    qMsg.pin();

    await moderation.addReviewChannel(
        message.guildId,
        parsed.bias,
        parsed.reviewChannel,
        qMsg.id,
        rrMsg.id
    );

    return message.reply("Bias associated with channel.");
}

module.exports = {
    run,
};
