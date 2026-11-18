const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const JsonConfigDataAccess = require("../dataaccess/JsonConfigDataAccess");

class ModerationService{

    constructor(
        userData = new JsonUserDataAccess(),
        configData = new JsonConfigDataAccess()
    ) {
        this.userData = userData;
        this.configData = configData;
    }

    async configure(guildId, submissionChannel, submissionLogChannel, journeyLogChannel){
        let config = await this.configData.getConfig(guildId);
        if(!config){
            config = new ServerConfig(guildId, submissionChannel, submissionLogChannel, journeyLogChannel);
        }
        else{
            config.reconfigure(submissionChannel, submissionLogChannel, journeyLogChannel);
        }
        await this.configData.setConfig(config);
    }

}
const moderation = new ModerationService();
module.exports = moderation;
module.exports.ModerationService = ModerationService;