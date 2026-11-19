const fs = require("fs");
const path = require("path");
const {ServerConfig} = require("../objects/ServerConfig");

class JsonConfigDataAccess {

    constructor(
        dataFolderPath = path.join(__dirname, "../Data"),
        configFilePath =  "/config.json"
    ) {
        this.dataFolderPath = dataFolderPath;
        this.configFilePath = configFilePath;
        this.config = this.importConfig();
    }

    configPath(){
        return path.join(this.dataFolderPath, this.configFilePath);
    }

    importConfig(){
        const configsMap = new Map();
        if (fs.existsSync(this.configPath())) {
            const rawJson = fs.readFileSync(this.configPath(), "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            for (const item of parsedJson){
                const config = Object.assign(new ServerConfig(), item);
                configsMap.set(item.guildId, config);
            }
        }
        return configsMap;
    }

    async getConfig(guildId){
        return this.config.get(guildId);
    }

    async setConfig(guildId, newConfig){
        this.config.set(guildId, newConfig);
        await this.saveConfig();
    }

    async saveConfig(){
        const items = Array.from(this.config.values());
        fs.writeFileSync(this.configPath(), JSON.stringify(items, null, 2));
    }

}
module.exports = JsonConfigDataAccess;