const NohitService = require("../../service/NohitService.js");

async function run(message, args, client, user){
    for (const nohit of NohitService.nohitData.nohits.get(message.guildId).values()){
        const boss = NohitService.resolveBoss(message.guildId, NohitService.resolveDifficulty(message.guildId, nohit.Difficulty)?.base, nohit.Boss);
        nohit.Boss = boss?.textName ?? nohit.Boss;
        
    }
    NohitService.nohitData.saveNohits(message.guildId);

    await NohitService.nohitData.buildJourneysFromNohitBotv2(message.guildId);
    await NohitService.addJourneyAssociation(message.guildId);

    const ignore = NohitService.nohitData.importIgnoredJourneys(message.guildId);
    const list = await NohitService.completedJourneysList(message.guildId);
    if (list[0]?.UserID){
        for (let i = 0; i < list.length; i++){
            const journey = await NohitService.lookupByUser(message.guildId, list[i].UserID, list[i].Difficulty);
            if (!journey){
                list.splice(i--, 1);
            }
            else{
                const diff = NohitService.resolveDifficulty(message.guildId, journey?.Difficulty).base;
                const ignored = ignore.some((e) => e.Key === journey.UserID && e.Value === journey.Difficulty);
                list[i] = { ID: journey?.ID, Bias: diff.bias, Ignored: ignored, Nohit: false };
            }
        }
        NohitService.nohitData.saveCompleteJourneys(message.guildId);
    }
    return message.reply("Nohit names updated;\nJourney rework built;\nCompleted journeys reformatted;\ninitialized successfully.");
}

module.exports = {
    run
}
