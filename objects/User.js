
const LanguageDataAccess = require("../dataaccess/LanguageDataAccess");

class User{
    ID;
    OwnedNohits = new Map();
    Language = "English";
    ResponseTable = new Map();
    recentGuildId;

    constructor(id){
        this.ID = id
    }
    
    async addJourney(difficulty, id){
        this.OwnedNohits.set(difficulty, id);
    }


    // HOW TO USE THIS:
    // "key" represents the first half of the json key-value pair. For example, "lf".
    // "iterator" represents the second half. It is basically a discriminator.
    // The "increment" function is included for convenience; essentially, it can be used to allow you to give a different response every time the bot is called.
    // "args" allows you to pass stuff into the response.
    // 
    // TO ADD RESPONSES:
    // Go to the "Languages" folder, and go to english or whatever. Then, add a kvp where the key is your desired "key" + "iterator".
    // By default, there is no "lf0", just type "lf". Additionally, if you have no special logic, that's all you need to do.
    // If you have special logic such as an incrementor, it is NOT necessary to add a separate response for every increment.
    // By default, if you pass in "lf4" as a key and no lf4 key exists in your language pack, it will search for a key with a lesser discriminator (like lf3) until it finds one or goes negative.



    getResponse(key, ...args){
        const iteration = this.responseBehavior(key, args);
        return LanguageDataAccess.getResponse(this.Language, key, iteration.value, iteration.args);
    }

    responseBehavior(key, args){
        let value = this.ResponseTable.get(key);
        let transArgs = args;
        switch (key)
        {
            case "buh":
                value = this.increment(value, 13);
                transArgs = [13 - value];
                console.log(value + transArgs)
                break;
            default:
                return;
        }
        this.ResponseTable.set(key, value);
        return { value, args: transArgs };
    }

    increment(val, max){
        if (val === undefined){
            val = 0;
        }
        else if (val < max){
            val++;
        }
        return val;
    }
}
module.exports = {User};
