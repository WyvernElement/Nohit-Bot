const NohitService = require("../service/NohitService.js");

function parseCopyDifficultyArgs(args) {
    if (args.length !== 3) {
        return undefined;
    }
    const name = args[0];
    const abbreviation = args[1];
    const source = args[2];
    if (!name || !abbreviation || !source) {
        return undefined;
    }
    return { name, abbreviation, source };
}

async function run(message, args, client, user) {
    const parsed = parseCopyDifficultyArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!copydifficulty <name> <abbreviation> <source>` — one word per field, no spaces.\nExample: `!copydifficulty Malice M Death`"
        );
    }

    const source = NohitService.findDifficulty(message.guildId, parsed.source);
    if (!source) {
        return message.reply(`No difficulty matching **${parsed.source}** was found.`);
    }

    const result = NohitService.copyDifficulty(
        message.guildId,
        parsed.name,
        parsed.abbreviation,
        parsed.source
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

    return message.reply(
        `Created base difficulty **${result.name}** (\`${result.abbreviation}\`) copied from **${source.name}**.`
    );
}

module.exports = {
    run,
};
