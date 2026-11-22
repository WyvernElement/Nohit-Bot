const moderation = require("../../service/ModerationService.js");
const DiscordService = require("../../service/DiscordService.js");

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

    const config = await moderation.getConfig(message.guildId);

    const clean = config.getReview(parsed.bias);

    if (clean){
        if (!parsed.reviewChannel){
            config.reviewChannel.delete(parsed.bias);
        }
        else{
            DiscordService.deleteMessageInChannel(clean.ID, clean.Queue);
            DiscordService.deleteMessageInChannel(clean.ID, clean.RR);
        }
    }

    const qmsg = `Temporary queue placeholder for ${parsed.bias}, still trying to think of how to handle updating this`;
    const rrmsg = `same but for requested reviews`;


    config.addReviewChannel(
        parsed.bias,
        parsed.reviewChannel,
        (await DiscordService.sendMessageInChannel(qmsg, parsed.reviewChannel)).id,
        (await DiscordService.sendMessageInChannel(rrmsg, parsed.reviewChannel)).id
    );
    moderation.configData.setConfig(message.guildId, config);

    return message.reply("Bias associated with channel.");
}

module.exports = {
    run,
};
