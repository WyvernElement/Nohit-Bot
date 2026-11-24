const NohitService = require("../../service/NohitService.js");

const Description = "Determines whether or not a completed journey (or nohit of a specific boss) on the given difficulty appears in the misc queue.";

async function run(message, args, client, user) {
    if (args.length === 0) {
        return message.reply("Usage: `!togglemisc <difficulty>` OR `!togglemisc <difficulty> <boss>`.\nExample: `!togglemisc Empyreal`, `!tm d br`");
    }
    const parsed = NohitService.resolveDifficulty(message.guildId, args[0]).base;
    if (!parsed) {
        return message.reply("Usage: `!togglemisc <difficulty>`.\nExample: `!togglemisc Empyreal`");
    }
    const pboss = NohitService.resolveBoss(message.guildId, parsed, args[1]);
    
    console.log(pboss)
    let sp;
    if (pboss){
        pboss.special = !pboss.special
        if (pboss.special){
            parsed.specialBosses.push(parsed.bosses.splice(parsed.bosses.indexOf(pboss), 1)[0]);
            sp = true;
        }
        else{
            parsed.bosses.push(parsed.specialBosses.splice(parsed.specialBosses.indexOf(pboss), 1)[0]);
            sp = false;
        }
    }
    else{
        parsed.toggleSpecial();
    }
    NohitService.nohitData.saveDifficulties(message.guildId);

    if ((sp != undefined && sp) || (sp === undefined && parsed.special)){
        return message.reply(`${(pboss) ? pboss.textName : parsed.name} is now special, and not in a good way.`);
    }
    return message.reply(`${(pboss) ? pboss.textName : parsed.name} is no longer aberrant! Hooray for the status quo!`);
}

module.exports = {
    run,
    Description
};
