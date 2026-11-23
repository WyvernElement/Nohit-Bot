require("discord.js");

class DiscordService{

    constructor(){
        this.client = null;
    }

    setClient(client){
        this.client = client;
    }

    async getMember(userId){
        return await this.client.users.fetch(userId);
    }

    async getDM(userId){
        const member = await this.getMember(userId);
        return await member.createDM();
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

    async sendMessageInChannel(message, channelId, embed){
        const channel = await this.client.channels.fetch(channelId);
        return await channel.send({
            content: message,
            embeds: embed
        });
    }

    async deleteMessageInChannel(channelId, messageId){
        const channel = await this.client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);
        await message.delete();
    }

    async editMessageInChannel(channelId, messageId, edit){
        const channel = await this.client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);
        return message.edit(edit);
    }

}
module.exports = new DiscordService();