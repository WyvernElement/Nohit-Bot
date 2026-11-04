const NohitService = require("../service/NohitService.js");

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
    if (args.length !== 3) {
        return undefined;
    }
    const name = args[0];
    const abbreviation = args[1];
    const isModifier = parseBoolean(args[2]);
    if (isModifier === undefined || !name || !abbreviation) {
        return undefined;
    }
    return { name, abbreviation, isModifier };
}

async function run(message, args, client) {
    const parsed = parseCreateDifficultyArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!createdifficulty <name> <abbreviation> <isModifier>` — one word per field, no spaces.\nExample: `!createdifficulty Death D false` or `!createdifficulty Shroomed S true`"
        );
    }

    const result = NohitService.createDifficulty(
        parsed.name,
        parsed.abbreviation,
        parsed.isModifier
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
