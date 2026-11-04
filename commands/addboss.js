const NohitService = require("../service/NohitService.js");

function parseAddBossArgs(args) {
    if (args.length < 2) {
        return undefined;
    }
    const difficulty = args[0];
    const boss = args.slice(1).join(" ").trim();
    if (!difficulty || !boss) {
        return undefined;
    }
    return { difficulty, boss };
}

async function run(message, args, client) {
    const parsed = parseAddBossArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!addboss <difficulty> <boss name>`\nExample: `!addboss Death King Slime`"
        );
    }

    const result = await NohitService.addBoss(parsed.difficulty, parsed.boss);

    if (result === undefined) {
        return message.reply(
            "Could not add that boss — use a base difficulty name or abbreviation (not a modifier)."
        );
    }
    if (result.duplicate) {
        return message.reply(
            `**${parsed.boss}** is already on **${NohitService.findDifficulty(parsed.difficulty)?.name ?? parsed.difficulty}**.`
        );
    }

    return message.reply(
        `Added **${parsed.boss}** to **${result.name}** (${result.bosses.length} boss${result.bosses.length === 1 ? "" : "es"} total).`
    );
}

module.exports = {
    run,
};
