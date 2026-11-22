const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const JsonConfigDataAccess = require("../dataaccess/JsonConfigDataAccess");
const {ServerConfig} = require("../objects/ServerConfig");

class ModerationService{

    constructor(
        userData = new JsonUserDataAccess(),
        configData = new JsonConfigDataAccess()
    ) {
        this.userData = userData;
        this.configData = configData;
    }

    async configure(guildId, submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel, journeyQueueMessage, rrQueueMessage){
        let config = await this.configData.getConfig(guildId);
        if(!config){
            config = new ServerConfig(guildId, submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel, journeyQueueMessage, rrQueueMessage);
        }
        else{
            config.reconfigure(submissionChannel, submissionLogChannel, journeyLogChannel, nohitQueueChannel, databaseBackupChannel, journeyQueueMessage, rrQueueMessage);
        }
        await this.configData.setConfig(guildId, config);
    }

    async getConfig(guildId){
        return await this.configData.getConfig(guildId);
    }

    async moderate(message, client){
        const config = await this.getConfig(message.guildId);
        if (config.submissionChannel === message.channelId && !message.content.startsWith("!s")){
            message.delete();
            return false;
        }

        return true;
    }

    async toggleAllSubmissions(guildId){
        const config = await this.getConfig(guildId);
        config.toggleSubmissions();
        await this.configData.setConfig(guildId, config);
        return config.submissionsAllowed;
    }

    async getSubmissionsAllowed(guildId){
        const config = await this.getConfig(guildId);
        return config.submissionsAllowed;
    }
}
const moderation = new ModerationService();
module.exports = moderation;
module.exports.ModerationService = ModerationService;