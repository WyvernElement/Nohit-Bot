const DiscordService = require("../../service/DiscordService");
const NohitService = require("../../service/NohitService.js");
const {v, dq} = require("../../discord/emoji_util");

const Description = `Judges a given nohit by ID. "next", "random", and "undo" are also accepted as arguments.`;

async function run(message, args, client, user) {

    const parsed = await parseNohit(message.guildId, args, message.author.id);

    if (parsed.missing){
        return message.reply("Usage: `!review <identifier: either ID, next/left empty, or random> <verification> <optional comment>`.\nExample: `!review next dq sorry, you were 5 seconds under mnl.` or `!review 37082 v`");
    }
    if (parsed.next){
        return message.reply("No next nohit to judge!");
    }
    if (parsed.prev){
        return message.reply("No previous review to undo!");
    }
    if (parsed.id){
        return message.reply("Nohit ID not recognized!");
    }
    if (parsed.special){
        return message.reply("That's not an ID, but I don't know what it's supposed to be. Help me out here.");
    }
    if (parsed.completed){
        return message.reply("This journey's already been completely judged, go find a different one.");
    }
    if (parsed.UserID === message.author.id){
        //return message.reply("You can't judge your own nohits lol");
    }

    const member = await DiscordService.getMember(parsed.UserID);

    if (parsed.undone){
        const channel = await DiscordService.getDM(parsed.UserID);
        for (const id of parsed.reviewMessage){
            const message = await channel.messages.fetch(id);
            await message.edit(`**This review was reverted.**
            ${(parsed.apology.length > 0) ? `\nA message from the perpetrator: "${parsed.apology}"` : ""}`);
        }
        return message.reply(`Review on **${parsed.nohitId} - ${parsed.boss}** successfully undone!`);
    }



    const flag = parseVerification(args.shift());
    if (!flag){
        return message.reply("To judge a nohit use v or dq. Or, I guess, the long forms, if you're weird")
    }


    const judge = NohitService.checkJudge(message.guildId, message.author.id);

    const comment = args.join(" ");
    const ver = flag === "Verified";
    const review = await member.send(`**[${parsed.ID}]** ${(ver) ? v : dq} Your **${parsed.Boss}** nohit on **${parsed.Difficulty}** has been ${flag.toLowerCase()} by __${message.author.displayName}__${(ver) ? "!!" : "."} ${judge.Emoji}
${(comment.length > 0)
    ? `They also left a comment for you: "${comment}"`
    : "No comment was left."}`);

    parsed.review(flag, message.author.id, comment, review.id);
    await NohitService.nohitData.submitNohit(message.guildId, parsed);


    await NohitService.updateJourneys(message.guildId);
    const journey = await NohitService.lookupByUser(message.guildId, parsed.UserID, parsed.Difficulty);
    const diff = NohitService.resolveDifficulty(message.guildId, parsed.Difficulty).base;
    const specialBoss = NohitService.resolveBoss(message.guildId, diff, parsed.Boss).special;
    if (specialBoss){
        NohitService.removeCompletedJourney(message.guildId, parsed.ID, diff.bias, true);
        judge.Prev.unshift(parsed.ID);
        return message.reply(`Nohit **${parsed.ID}** reviewed!`);
    }
    else{
        if (journey.DQ === 0 && journey.Pending === 0 && diff.bosses.length <= journey.V){
            journey.Completed = true;
            NohitService.removeCompletedJourney(message.guildId, journey.ID, diff.bias, false);
        }

        if (await NohitService.lookupReview(message.guildId, parsed.ID)){
            NohitService.removeReview(message.guildId, parsed.ID);
            return message.reply(`Nohit **${parsed.ID}** reviewed!`);
        }
        else{
            judge.Prev.unshift(parsed.ID);
            const next = await findNext(message.guildId, journey);
            judge.Next = next?.ID;

            return message.reply(`Nohit **${parsed.ID}** reviewed!${(next?.ID) ? `\nNext nohit: **${next.ID} - [${next.Boss}](<${next.Url}>)**` : ""}`);
        }
    }
}

async function parseNohit(guild, args, author){
    if (args.length === 0){
        return { missing: true };
    }

    if (!Number.isFinite(Number(args[0]))){
        const judge = NohitService.checkJudge(guild, author);
        
        const undo = ["u", "undo"];
        if (undo.includes(args[0].toLowerCase())){
            if (judge.Prev.length === 0){
                return { prev: true };
            }
            
            const nohit = await NohitService.lookup(guild, judge.Prev.shift());
            const reviewMessage = nohit.undo(author);
            args.shift();
            const apology = args.join(" ");

            return { undone: true, UserID: nohit.UserID, nohitId: nohit.ID, boss: nohit.Boss, reviewMessage, apology };
        }



        const nextNohit = await NohitService.lookup(guild, judge.Next);
        if (!nextNohit){
            return { next: true };
        }
        const journey = await NohitService.lookupByUser(guild, nextNohit.UserID, nextNohit.Difficulty);

        const remaining = [];
        for (const id of journey.NohitIDs){
            const nohit = await NohitService.lookup(guild, id);
            if (nohit.Verification === "Pending"){
                remaining.push(nohit);
            }
        }

        const random = ["r", "rand", "random"];
        if (random.includes(args[0].toLowerCase())){
            if (remaining.length === 0){
                return { completed: true };
            }
            args.shift();
            return remaining[Math.floor(Math.random() * remaining.length)];
        }

        const next = ["n", "next"]
        if (next.includes(args[0].toLowerCase())){
            args.shift();                
        }
        const verific = ["v", "verification", "d", "dq", "disqualified"]
        if (verific.includes(args[0].toLowerCase())){
            if (nextNohit.Verification != "Pending"){
                return await findNext(guild, journey) ?? { completed: true };
            }
            return nextNohit;
        }
        else{
            return { special: true };
        }
    }
    else{
        return await NohitService.lookup(guild, args.shift()) ?? { id: true };
    }
}

async function findNext(guild, journey){
    for (const id of journey.NohitIDs){
        const nohit = await NohitService.lookup(guild, id);
        if (nohit.Verification === "Pending"){
            return nohit;
        }
    }
    return undefined;
}

function parseVerification(key){
    if (!key){
        return undefined;
    }
    if ("verified".includes(key.toLowerCase()) || "real".includes(key.toLowerCase())){
        return "Verified";
    }
    if ("disqualified".includes(key.toLowerCase()) || "dq" === key.toLowerCase()){
        return "Disqualified";
    }
    return undefined;
}

module.exports = {
    run,
    Description
};
