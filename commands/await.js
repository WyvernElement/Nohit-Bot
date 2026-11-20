async function run(message, args, client, user) {
    return message.reply(`${awai()}`);
}

async function awai(){
    return new Object();
}

module.exports = {
    run,
};
