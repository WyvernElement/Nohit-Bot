const NohitService = require("../../service/NohitService.js");
const ModerationService = require("../../service/ModerationService");

function parseCopyDifficultyArgs(args) {
    const name = args[0];
    const abbreviation = args[1];
    const bias = args[2];
    const source = args[3];
    if (!name || !abbreviation || !bias || !source) {
        return undefined;
    }
    return { name, abbreviation, bias, source };
}

async function run(message, args, client, user) {
    const parsed = parseCopyDifficultyArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!copydifficulty <name> <abbreviation> <bias> <source>` — one word per field, no spaces.\nExample: `!copydifficulty Malice M Calamity Death`"
        );
    }

    const source = NohitService.findDifficulty(message.guildId, parsed.source);
    if (!source) {
        return message.reply(`No difficulty matching **${parsed.source}** was found.`);
    }

    const config = await ModerationService.getConfig(message.guildId)
    const parsedBias = config.reviewChannels.keys().find(e => e.includes(parsed.bias))
    if (!parsedBias) {
        return message.reply(`The bias **${parsed.bias}** is incomprehensible.`);
    }

    const result = NohitService.copyDifficulty(
        message.guildId,
        parsed.name,
        parsed.abbreviation,
        parsed.source,
        parsedBias
    );

    if (result === undefined) {
        return message.reply("Could not create that difficulty — check the name and abbreviation.");
    }
    if (result.conflict === "name") {
        return message.reply(`A difficulty named **${parsed.name}** already exists.`);
    }
    if (result.conflict === "abbreviation") {
        return message.reply(`The abbreviation **${parsed.abbreviation}** is already in use.`);
    }
    if (result.conflict === "bias") {
        return message.reply(`The bias **${parsed.bias}** is incomprehensible.`);
    }

    return message.reply(
        `Created base difficulty **${result.name}** (\`${result.abbreviation}\`) copied from **${source.name}**.`
    );
}

module.exports = {
    run,
};
