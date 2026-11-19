class User{
    ID;
    OwnedNohits = new Map();
    Language;
    ResponseTable = new Map();

    constructor(id){
        this.ID = id
    }
    
    async addJourney(difficulty, id){
        this.OwnedNohits.set(difficulty, id);
    }

    async getResponse(key){
        const value = this.ResponseTable(key);
        return value;
    }

    // todo for language stuff and more complex responses (tracking what the bot has said and to who)
}
module.exports = {User};
