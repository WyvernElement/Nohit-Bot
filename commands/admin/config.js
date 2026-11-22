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
    const submissionChannel = parseChannel(args[0]);
    const submissionLogChannel = parseChannel(args[1]);
    const journeyLogChannel = parseChannel(args[2]);
    const nohitQueueChannel = parseChannel(args[3]);
    const databaseBackupChannel = parseChannel(args[4]);
    if (!submissionChannel || !submissionLogChannel || !journeyLogChannel || !nohitQueueChannel || !databaseBackupChannel) {
        return undefined;
    }
    return { submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel };
}

async function run(message, args, client, user) {
    const parsed = parseConfigArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!config <submissionChannel> <submissionLogChannel> <journeyLogChannel> <nohitQueueChannel> <databaseBackupChannel>`\nExample: `!config #submissions #submission-log #journey-log #nohit-queue #database-backups`"
        );
    }

    const config = await moderation.getConfig(message.guildId);
    if (config.journeyQueueMessage){
        DiscordService.deleteMessageInChannel(config.nohitQueueChannel, config.journeyQueueMessage);
        DiscordService.deleteMessageInChannel(config.nohitQueueChannel, config.rrQueueMessage);
    }
    
    
    const queue = await DiscordService.sendMessageInChannel("This is the queue message", config.nohitQueueChannel);
    const rr = await DiscordService.sendMessageInChannel("And this is the rr message", config.nohitQueueChannel);

    await moderation.configure(
        message.guildId,
        parsed.submissionChannel,
        parsed.submissionLogChannel,
        parsed.journeyLogChannel,
        parsed.nohitQueueChannel,
        parsed.databaseBackupChannel,
        queue.id,
        rr.id
    );

    return message.reply("Server config updated.\nQueue messages replaced.");
}

module.exports = {
    run,
};
