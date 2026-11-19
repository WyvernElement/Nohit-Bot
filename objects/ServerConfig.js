class ServerConfig{
    guildId;
    submissionChannel;
    submissionLogChannel;
    journeyLogChannel;
    rolesMap;
    journeyQueueMessage;
    rrQueueMessage;

    constructor(guildId, submissionChannel, submissionLogChannel, journeyLogChannel) {
        this.guildId = guildId;
        this.reconfigure(submissionChannel, submissionLogChannel, journeyLogChannel)
    }

    reconfigure(submissionChannel, submissionLogChannel, journeyLogChannel){
        this.submissionChannel = submissionChannel;
        this.submissionLogChannel = submissionLogChannel;
        this.journeyLogChannel = journeyLogChannel;
    }


}

module.exports = {ServerConfig};