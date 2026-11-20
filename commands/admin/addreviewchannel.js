const moderation = require("../../service/ModerationService.js");

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
    if (!bias || !reviewChannel) {
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
    console.log(config);
    config.reviewChannels.set(parsed.bias, parsed.reviewChannel);
    moderation.configData.setConfig(message.guildId, config);

    return message.reply("Bias associated with channel.");
}

module.exports = {
    run,
};
