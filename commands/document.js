const Description = "Returns a link to the nohit rules and guidelines document.";

async function run(message, args, client, user){
    return message.reply(`Here: https://docs.google.com/document/d/1y8eSOFCE1Yikp9SlNkXrJUVH3FBPe4aEuxUKjUpwAFc/edit?usp=sharing`);
}

module.exports = {
    run,
    Description
}
