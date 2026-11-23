const DiscordService = require("../../service/DiscordService");
const NohitService = require("../../service/NohitService.js");

const {parseForKeywords} = require("../../discord/argument_util");

const Description = "Deletes a nohit. Do **__NOT__** use this without proper discretion. It is restricted to judges-only specifically for this reason.";

async function run(message, args, client, user) {
    if (args.length === 0){
        return message.reply("Usage: `!delete <id>` or `!delete <boss> <difficulty> <userid>`");
    }

    const parsed = parseForKeywords(message.guildId, args);
    let nohit;
    if (parsed.num){
        nohit = await NohitService.lookup(message.guildId, parsed.num);
        if (!nohit){
            return message.reply("That's not a valid nohit ID.");
        }
    }
    else{
        if (!parsed.Diff){
            return message.reply("Difficulty misspelling.");
        }
        if (!parsed.Boss){
            return message.reply("Boss misspelling.");
        }
        if (!parsed.ID){
            return message.reply("Please provide a user ID. Yes, even if it's *your* nohit you want to delete. This is judge-locked for a reason.");
        }
        nohit = await NohitService.lookupByBoss(message.guildId, parsed.ID, parsed.Diff, parsed.Boss.name);
        if (!nohit){
            return message.reply("That nohit does not exist.");
        }
    }

    if(nohit.UserComment === "Deleted" && nohit.UserID === 0){
        return message.reply("Stop, stop! It's already dead!");
    }
    
    const member = await DiscordService.getMember(nohit.UserID);
    await member.send(`Your nohit **[${nohit.ID}]** - **${nohit.Boss}** on **${nohit.Difficulty}** mode was deleted by __${message.author.displayName}__.
${(args.length === 0)
        ? ""
        : `Reason: "${args.join(" ")}"`
    }`);
    
    NohitService.deleteNohit(message.guildId, nohit);

    return message.reply(`Nohit **[${nohit.ID}]** deleted, I hope that was necessary.`);
}

module.exports = {
    run,
    Description
};
