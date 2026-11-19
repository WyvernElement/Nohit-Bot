const DiscordService = require("../service/DiscordService");
const NohitService = require("../service/NohitService.js");

async function run(message, args, client, user){
    const id = args[0];
    const iid = args[1] ?? message.author.id;
    const journey = await NohitService.lookupJourney(message.guildId, id) ?? await NohitService.lookupByUser(message.guildId, id, iid) ?? await NohitService.lookupByUser(message.guildId, iid, id);
    if (journey === undefined){
        if (NohitService.resolveDifficulty(message.guildId, id) === undefined && NohitService.resolveDifficulty(message.guildId, iid) === undefined){
            return message.reply("Try again, love. You're not making sense here.");
        }
        else{
            return message.reply(`${iid === message.author.id ? "You haven't": "That user hasn't"} submitted any nohits for that difficulty.`);
        }
    }
    else{
        const resolved = NohitService.resolveDifficulty(message.guildId, journey.Difficulty);
        const difficulty = resolved ? resolved.base : NohitService.findDifficulty(message.guildId, journey.Difficulty);
        let bosses = difficulty.bosses;
        bosses.sort((a, b) => a.progressionOrder - b.progressionOrder);
        let bossNames = [];
        for(const boss of bosses) {
            bossNames.push(boss.textName);
        }
        for(const nohitID of journey.NohitIDs){
            let nohit = await NohitService.lookup(message.guildId, nohitID);
            const index = bossNames.indexOf(nohit.Boss);
            if(index > -1){
                bossNames.splice(index, 1);
            }
        }
        let msg = `__Remaining nohits for **${await DiscordService.getDisplayName(iid)}** on **${resolved.standard}** mode__\n\n`;
        for(const boss of bossNames){
            msg += boss + "\n";
        }
        msg += `\n**${bossNames.length}** nohits remaining. Best of luck :salute:`
        return message.reply(msg);
    }
}
module.exports = {run};