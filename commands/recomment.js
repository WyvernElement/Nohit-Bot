const NohitService = require("../service/NohitService.js");
const {parseForKeywords} = require("../discord/argument_util");

const Description = "Allows you to add, change, or remove your comment on a nohit.";

async function run(message, args, client, user){
    if (args.length === 0){
        return message.reply("Uhh... whatttt do you want from me? I can't *do* anything if you're not going to *tell me* anything.");
    }

    const parsed = parseForKeywords(message.guildId, args);

    let nohit;
    if (parsed.num){
        nohit = await NohitService.lookup(message.guildId, parsed.num);
        if (!nohit){
            return message.reply("That's not a valid nohit ID!")
        }
        else if (nohit.UserID != message.author.id){
            return message.reply("Hey, now, that isn't yours!");
        }
    }
    else{
        if (parsed.ID && message.author.id != parsed.ID){
            return message.reply("Points for being funny, but you're not allowed to change other people's comments.")
        }
        if (!parsed.Diff){
            return message.reply("I think you made a misspelling with the difficulty there.");
        }
        if (!parsed.Boss){
            return message.reply("So, uh... what boss exactly? It seems to be a little... nonexistant...");
        }
        nohit = await NohitService.lookupByBoss(message.guildId, message.author.id, parsed.Diff, parsed.Boss.name);
        if (!nohit){
            return message.reply("You rewriting a comment from the future? Lemme know how that goes.");
        }
    }

    const comment = args.join(" ");
    nohit.UserComment = comment;
    NohitService.nohitData.saveNohits(message.guildId);
    return message.reply((comment.length === 0) ? "Comment removed!" : "Comment rewritten!");
}

module.exports = {
    run,
    Description
}
