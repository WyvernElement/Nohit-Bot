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

    async editMessage(message, newMessage){
        await message.edit(newMessage);
    }

    async findDirectMessage(userId, content){
        const channel = await this.getDM(userId);
        const messages = await channel.messages.fetch({ limit: 100, cache: false });
        const msg = messages.find((msg) => msg.content.includes(content));
        return msg;
    }


}
module.exports = new DiscordService();