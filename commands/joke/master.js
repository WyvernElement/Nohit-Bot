async function await(message, args, client, user) {
    return message.reply(`${awai()}`);
}

async function awai(){
    return new Object();
}


async function buh(message, args, client, user) {
    return message.reply(user.getResponse("buh"));
}

async function kill(message, args, client, user) {
    console.log(message.mentions.users);
    const idList = [...message.mentions.users.keys()].toReversed();
    console.log(idList);
    if (idList.length > 0){
        const user = idList.shift();
        let response = `<@${user}> was OBLITERATED VISCIOUSLY!!!!!!!!
<@${user}> was RIPPED LIMB FROM LIMB!!! DESTROYED!!!!!! ANNIHILATED!!!!!! SUPERSATURATED!!!!!!!!!!!! <@${user}> was sent to SUPER HELL!!!!! <@${user}> was REDUCED TO CINDERS!!!!!
DEVASTATED!!!!!! PUPPETED!!!!!!! A LIVING TAPESTRY OF TORMENT!!!!!!! blah blah blah IRRADIATED!!!!!!!!!!!!!!!!!!!!!!!!! did i mention DESTROYED!!!!!! already? okay good
BRUTALLY EXSANGUINATED!!!!! turned into LONG- oh thats gross ew STRINGS WERE CUT!!!!!! TORMENTED BY UNFATHOMABLE GRIEF!!!!!!!! MASSACRED BY ILLUSIONS!!!!!!!!!!!!! met THE HORSE!!!!!!!!!!!!!!!!!!!!!!
stubbed their TOE!!! titrated into a FINE POWDER!!!!! made into a VERY LOVELY COAT RACK!!!
SHOVED INTO A HYDRAULIC PRESS! TWICE!!

<@${user}> was FORCED TO NOHIT BOSS RUSH!!!!!!!`;

        if (idList.length > 0){
            response += `\n\n\n\n\n\n oh right and<@${idList.join("> <@")}> you guys too`;
        }

        return message.reply(response);
    }
}

module.exports = {
    await,
    buh,
    kill
};
