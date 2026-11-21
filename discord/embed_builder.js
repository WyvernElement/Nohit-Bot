const fs = require("fs");
const path = require("path");

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
        {name: 'User Comment', value: (nohit.UserComment === "") ? "No user comment" : nohit.UserComment},
        {name: `${nohit.Verification} ${(nohit.Verification === "Pending") ? "verification": ""}`, value: (nohit.JudgeComment === "Pending") ? "No judge comment" : nohit.JudgeComment},
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

async function commands(judge, admin){
    const commandDir = path.join(__dirname, "../commands")
    const fields = [];
    for (const dir of fs.readdirSync(commandDir)){
        const name = path.parse(path.join(commandDir, dir)).name
        const blacklist = ["admin", "judging", "help", "await"]
        if (!blacklist.includes(name)){
            const command  = require('../commands/' + name);
            fields.push({
                name: name,
                value: command.Description ?? "No description provided"
            });
        }
    }
    return fields;
}

async function reorder(fields){
    const order = [
        "submit",
        "requestreview",
        "lookup",
        "progress",
        "remaining",
        "document",
        "recomment",
        "removerequest",
        "playlist",
        "overview",
        "catalogue",
        "catalogueall",
        "nohitstats"
    ];
    const reorder = order;
    for (const item of fields){
        const index = order.indexOf(item.name);
        if (index === -1){
            item.value = "No index provided"
            reorder.push(item);
        }
        else{
            reorder[index] = item;
        }
    }
    return reorder;
}

async function buildHelpEmbed(judge, admin){
    const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle(`Click here for a complete list of commands, their descriptions, and how to use them!`)
    .addFields(
        await reorder(await commands(judge, admin))
    )
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


module.exports = {buildNohitEmbed, buildCatalogueEmbed, buildOverviewEmbed, buildHelpEmbed};