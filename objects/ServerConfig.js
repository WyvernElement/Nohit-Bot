class ServerConfig{
    guildId;
    submissionChannel;
    submissionLogChannel;
    journeyLogChannel;
    rolesMap;
    nohitQueueChannel;
    databaseBackupChannel;
    journeyQueueMessage;
    rrQueueMessage;
    reviewChannels;

    constructor(guildId, submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel, journeyQueueMessage, rrQueueMessage) {
        this.guildId = guildId;
        this.reconfigure(submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel, journeyQueueMessage, rrQueueMessage);
    }

    reconfigure(submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel, journeyQueueMessage, rrQueueMessage){
        this.submissionChannel = submissionChannel;
        this.submissionLogChannel = submissionLogChannel;
        this.journeyLogChannel = journeyLogChannel;
        this.nohitQueueChannel = nohitQueueChannel;
        this.databaseBackupChannel = databaseBackupChannel;
        this.journeyQueueMessage = journeyQueueMessage;
        this.rrQueueMessage = rrQueueMessage;
    }

    getReview(key){
        if (key){
            return this.reviewChannels.get(this.reviewChannels.keys().find(e => e.includes(key)));
        }
        return undefined;
    }

    checkReview(token){
        if (this.reviewChannels.values().find(e => e.includes(token))){
            return true;
        }
        return false;
    }
}

module.exports = {ServerConfig};