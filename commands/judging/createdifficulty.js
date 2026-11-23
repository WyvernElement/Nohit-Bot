const NohitService = require("../../service/NohitService.js");
const ModerationService = require("../../service/ModerationService");

function parseBoolean(value) {
    const normalized = String(value).trim().toLowerCase();
    if (["true", "yes", "y", "1", "modifier", "mod"].includes(normalized)) {
        return true;
    }
    if (["false", "no", "n", "0", "base"].includes(normalized)) {
        return false;
    }
    return undefined;
}

function parseCreateDifficultyArgs(args) {
    const name = args[0];
    const abbreviation = args[1];
    const isModifier = parseBoolean(args[2]);
    const bias = args[3];
    if (isModifier === undefined || !name || !abbreviation) {
        return undefined;
    }
    return { name, abbreviation, isModifier, bias };
}

async function run(message, args, client, user) {
    const parsed = parseCreateDifficultyArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!createdifficulty <name> <abbreviation> <isModifier> <bias>` — one word per field, no spaces.\nExample: `!createdifficulty Death D false Calamity` or `!createdifficulty Shroomed S true`"
        );
    }

    const config = await ModerationService.getConfig(message.guildId);
    const parsedBias = config.reviewChannels.keys().find(e => e.includes(parsed.bias));
    if (!parsedBias) {
        return message.reply(`The bias **${parsed.bias}** is incomprehensible.`);
    }

    const result = NohitService.createDifficulty(
        message.guildId,
        parsed.name,
        parsed.abbreviation,
        parsed.isModifier,
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

    const kind = result.isModifier ? "modifier" : "base difficulty";
    return message.reply(
        `Created ${kind} **${result.name}** (\`${result.abbreviation}\`).`
    );
}

module.exports = {
    run,
};
