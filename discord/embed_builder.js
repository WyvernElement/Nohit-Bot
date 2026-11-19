const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");
const {v, dq} = require("../discord/emoji_util");

const { EmbedBuilder} = require('discord.js');
const {formatTimestamp} = require("./time_util");

async function buildNohitEmbed(nohit, guildId){
    //takes in a nohit, returns an embed.
    const embed = new EmbedBuilder()
    .setColor(getColor(nohit.Verification))
    .setTitle(`${nohit.Boss} on ${nohit.Difficulty} mode`)
    .setURL(nohit.Url)
    .setAuthor({name: await DiscordService.getDisplayName(nohit.UserID, guildId), iconURL: await DiscordService.getProfilePicture(nohit.UserID, guildId)})
    .setDescription(`ID: ${nohit.ID}\nSubmitted on: ${formatTimestamp(nohit.Timestamp)}`)
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
            value: `[Submitted: ${formatTimestamp(nohit.Timestamp)}](${nohit.Url})`
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

async function journeyFields(guildId, journeys){
    let fields = [];
    for (const j of journeys){
        let special = "";
        for (const s of j.SpecialIDs){
            const nohit = await NohitService.lookup(guildId, s);
            const emoji = nohit.Verification === "Pending" ? ':question:' : nohit.Verification === "Verified" ? v : dq;
            special += `\n[${nohit.Boss}](<${nohit.Url}>) - ${emoji}`
        }
        const link = j.Playlist;
            if (link != undefined){
                special += `\n[Playlist](<${link}>)`;
            }
        fields.push({
            name: `**[${j.ID}] - ${j.Difficulty}**`,
            value: `${(j.V > 0) ? `\nVerified: ${j.V}` : ""}${(j.DQ > 0) ? `\nDisqualified: ${j.DQ}` : ""}${(j.Pending > 0) ? `\nPending: ${j.Pending}` : ""}${special}`
        })
    }
    return fields;
}

async function buildOverviewEmbed(guildId, user){
    let journeys = [];
    let total = 0;
    let vs = 0;
    let dqs = 0;
    for (const [difficulty, id] of user.OwnedNohits){
        const journey = await NohitService.lookupJourney(guildId, id);
        total += journey.getTotal();
        vs += journey.V;
        dqs += journey.DQ;
        journeys.push(journey);
    }
    const embed = new EmbedBuilder()
    .setColor(Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0'))
    .setTitle(`Overview for ${await DiscordService.getDisplayName(user.ID, guildId)}`)
    .setDescription(`This user has submitted **__${total}__** total nohits, out of which:\n**${vs}** have been verified,\n**${dqs}** have been disqualified,\nand **${total - vs - dqs}** are still pending review.`)
    .addFields(
        await journeyFields(guildId, journeys)
    )
    .setFooter({text: `This user is pretty cool!`});
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


module.exports = {buildNohitEmbed, buildCatalogueEmbed, buildOverviewEmbed};