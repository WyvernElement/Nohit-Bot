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
        const channel = await client.channels.fetch(config.nohitQueueChannel);
        const queue = await channel.messages.fetch(config.journeyQueueMessage);
        await queue.delete();
        const rr = await channel.messages.fetch(config.rrQueueMessage);
        await rr.delete();
    }
    
    const channel = await client.channels.fetch(parsed.nohitQueueChannel);
    const queue = await channel.send("This is the queue message");
    
    const rr = await channel.send("And this is the rr message");

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
