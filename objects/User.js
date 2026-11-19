
const LanguageDataAccess = require("../dataaccess/LanguageDataAccess");

class User{
    ID;
    OwnedNohits = new Map();
    Language = "English";
    ResponseTable = new Map();

    constructor(id){
        this.ID = id
    }
    
    async addJourney(difficulty, id){
        this.OwnedNohits.set(difficulty, id);
    }

    getResponse(key){
        const iteration = this.responseBehavior(key);
        return LanguageDataAccess.getResponse(this.Language, key, iteration);
    }

    responseBehavior(key){
        let value = this.ResponseTable.get(key);
        switch (key)
        {
            case "lf":
                value = this.increment(value, 1);
                break;
            default:
                return;
        }
        this.ResponseTable.set(key, value);
        return value;
    }

    increment(val, max){
        if (val === undefined){
            val = 0;
        }
        else if (val < max){
            val++
        }
        return val;
    }

    // todo for language stuff and more complex responses (tracking what the bot has said and to who)
}
module.exports = {User};
