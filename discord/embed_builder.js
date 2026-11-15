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

async function constructFields(guildId, nohits, verified){
    let fields = [];
    for(const nohit of nohits){
        fields.push({
            name: `**\[${nohit.ID}\] ${await DiscordService.getDisplayName(nohit.UserID, guildId)}${!verified? ' - ' + resolveEmoji(nohit.Verification) : ''} **`,
            value: `[Submitted: ${nohit.Timestamp}](${nohit.Url})`
        });
    }
    return fields;
}

async function buildCatalogueEmbed (guildId, nohits, verified){
    //takes in array of nohits, returns embed
    const bossName = nohits[0].Boss;
    const difficultyName = nohits[0].Difficulty;
    const embed = new EmbedBuilder()
        .setColor(0xE03322)
        .setTitle(`${bossName} on ${difficultyName}`)
        .setDescription(`Here are ${nohits.length} of the latest nohits for ${bossName} on ${difficultyName}. All are ${verified? 'verified and' : ''} in descending order from most recent submission to earliest.`)
        .addFields(await constructFields(guildId, nohits, verified));
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

function resolveEmoji(Verification){
    switch(Verification){
        case "Verified":
            return ":V\_:";
        case "Disqualified":
            return ":DQ:";
        case "Pending":
            return ":question:";
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


module.exports = {buildNohitEmbed, buildCatalogueEmbed};