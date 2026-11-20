const NohitService = require("../service/NohitService.js");

function parseAddBossArgs(args) {
    if (args.length < 2) {
        return undefined;
    }
    
    let x = 0;
    if (Number.isFinite(Number(args[1]))){
        x = 1;
    }

    const difficulty = args[0];
    const order = args[2 - x];
    const boss = args.slice(3 - x).join(" ").trim();
    const id = (x) ? boss.replaceAll(' ', '').toLowerCase() : args[1];
    if (!difficulty || !id || !order || !boss) {
        return undefined;
    }
    return { difficulty, id, order, boss };
}

async function run(message, args, client, user) {
    const parsed = parseAddBossArgs(args);
    if (!parsed) {
        return message.reply(
            "Usage: `!addboss <difficulty> <boss identifier (optional)> <progression order> <boss name>`\nExample: `!addboss Death KingSlime 1000 King Slime`"
        );
    }

    const result = await NohitService.addBoss(message.guildId, parsed.difficulty, parsed.id, parsed.order, parsed.boss);

    if (result === undefined) {
        return message.reply(
            "Could not add that boss — use a base difficulty name or abbreviation (not a modifier)."
        );
    }
    if (result.duplicate) {
        return message.reply(
            `**${parsed.boss}** is already on **${NohitService.findDifficulty(message.guildId, parsed.difficulty)?.name ?? parsed.difficulty}**.`
        );
    }

    return message.reply(
        `Added **${parsed.boss}** to **${result.name}** (${result.bosses.length} boss${result.bosses.length === 1 ? "" : "es"} total).`
    );
}

module.exports = {
    run,
};
