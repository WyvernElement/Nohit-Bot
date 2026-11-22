const { buildNohitEmbed } = require("../discord/embed_builder.js");
const NohitService = require("../service/NohitService.js");

const {parseForKeywords} = require("../discord/argument_util");

const Description = "Finds a random nohit for you to gaze upon!";

async function run(message, args, client, user){
    const parsed = parseForKeywords(message.guildId, args);

    const bossName = parsed.Boss?.name;
    console.log(parsed.Diff);
    const verif = parseVerification(args[0]);
    const filteredNohits = NohitService.nohitData.nohits.get(message.guildId).values().filter((e) => 
        e.UserComment != "Deleted" && e.UserID != 0 &&
        (bossName ? e.Boss.toLowerCase().replaceAll(" ", "") === bossName : true) &&
        (parsed.Diff ? e.Difficulty === parsed.Diff : true) &&
        (verif ? e.Verification === verif : true)
    ).toArray();

    const replyPayload = await buildNohitEmbed(filteredNohits[Math.floor(Math.random() * filteredNohits.length)], message.guild.id);
    return message.reply({embeds: [replyPayload]});
}

function parseVerification(key){
    if (!key){
        return undefined;
    }
    if ("verified".includes(key.toLowerCase()) || "real".includes(key.toLowerCase())){
        return "Verified";
    }
    if ("disqualified".includes(key.toLowerCase()) || "dq" === key.toLowerCase()){
        return "Disqualified";
    }
    return undefined;
}

module.exports = {
    run,
    Description
}