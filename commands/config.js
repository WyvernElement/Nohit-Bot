const moderation = require("../service/ModerationService.js");

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
    if (args.length !== 3) {
        return undefined;
    }
    const submissionChannel = parseChannel(args[0]);
    const submissionLogChannel = parseChannel(args[1]);
    const journeyLogChannel = parseChannel(args[2]);
    if (!submissionChannel || !submissionLogChannel || !journeyLogChannel) {
        return undefined;
    }
    return { submissionChannel, submissionLogChannel, journeyLogChannel };
}

async function run(message, args, client) {
    const parsed = parseConfigArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!config <submissionChannel> <submissionLogChannel> <journeyLogChannel>`\nExample: `!config #submissions #submission-log #journey-log`"
        );
    }

    await moderation.configure(
        message.guildId,
        parsed.submissionChannel,
        parsed.submissionLogChannel,
        parsed.journeyLogChannel
    );

    return message.reply("Server config updated.");
}

module.exports = {
    run,
};
