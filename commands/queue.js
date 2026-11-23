const NohitService = require("../service/NohitService.js");
const ModerationService = require("../service/ModerationService");
const DiscordService = require("../service/DiscordService.js");

const Description = "Shows all journeys currently ready to be judged.";

async function run(message, args, client, user){
    const config = await ModerationService.getConfig(message.guildId);
    const bias = config.reviewChannels.keys().find(e => e.includes(args[0]));

    let response = `**__Finished nohit journeys that currently need judging__**`

    let count = 0;
    const objects = await NohitService.getViableCompletedJourneys(message.guildId, bias, true);
    for (const obj of objects){
        count++;
        const journey = await NohitService.lookupJourney(message.guildId, obj.ID);
        response += `\n${count}. ${await DiscordService.getDisplayName(journey.UserID, message.guildId)} - ${journey.Difficulty}`;
    }
    if (objects.length === 0){
        response += "\nNone!";
    }

    return message.reply(response);
}

module.exports = {
    run,
    Description
}