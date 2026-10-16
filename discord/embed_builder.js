const DiscordService = require("../service/DiscordService");

const { EmbedBuilder} = require('discord.js');

async function buildNohitEmbed(nohit, guildId){
    //takes in a nohit, returns an embed.
    const embed = new EmbedBuilder()
    .setColor(getColor(nohit.Verification))
    .setTitle(`${nohit.Boss} on ${nohit.Difficulty} mode`)
    .setURL(nohit.Url)
    .setAuthor({name: await DiscordService.getDisplayName(nohit.UserID, guildId), iconURL: await DiscordService.getProfilePicture(nohit.UserID, guildId)})
    .setDescription(`ID: ${nohit.ID}\nSubmitted on: ${nohit.Timestamp}`)
    .addFields(
        {name: 'User Comment', value: nohit.UserComment},
        {name: nohit.Verification, value: nohit.JudgeComment},
    )
    .setFooter({text: `${await getFooter(nohit, guildId)}`});
    return embed;
}
function getColor(Verification){
    switch(Verification){
        case "Verified":
            return 0x73B466;
        case "Disqualified":
            return 0xE03322;
        case "Pending":
            return 0xF4D848;
    }
}
async function getFooter(nohit, guildId){
    if(nohit.Verification === "Pending"){
        return "This nohit is pending review."
    }
    else{
        return (`${nohit.Verification} by ${await DiscordService.getDisplayName(nohit.JudgeID)}`);
    }
}


module.exports = {buildNohitEmbed};