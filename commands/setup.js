const NohitService = require("../service/NohitService.js");

async function run(message, args, client){
    await NohitService.nohitData.buildJourneysFromNohitBotv2(message.guildId);
    await NohitService.addJourneyAssociation(message.guildId);
    return message.reply("Journey rework built;\ninitialized successfully.");
}

module.exports = {
    run
}
