const Description = "Returns a link to Bronze's list of all nohit veterans.";

async function run(message, args, client, user){
    return message.reply(`Here!
https://docs.google.com/document/d/1wclpNP2bOqETwiKO-24YqX0MMFsPJfsFOUAlhQyWl2I/edit

This list is occasionally updated by Bronze and SirScorepan; if your name isn't on here and it should be, check back soon!`);
}

module.exports = {
    run,
    Description
}
