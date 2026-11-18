require("discord.js");

class DiscordService{

    constructor(){
        this.client = null;
    }

    setClient(client){
        this.client = client;
    }

    async getDisplayName(userId, guildId){
        /*const guild = await this.client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);*/
        const member = await this.client.users.fetch(userId);
        return member.nickname ?? member.displayName;
    }

    async getProfilePicture(userId, guildId){
        /*const guild = await this.client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);*/
        const member = await this.client.users.fetch(userId);
        return member.displayAvatarURL({dynamic: true});
    }

    async sendMessageInChannel(message, channelId){
        const channel = await this.client.channels.fetch(channelId);
        await channel.send(message);
    }

}
module.exports = new DiscordService();