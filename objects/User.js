class User{
    ID;
    OwnedNohits = new Map();
    Language;

    constructor(id){
        this.ID = id
    }
    
    async addJourney(difficulty, id){
        this.OwnedNohits.set(difficulty, id);
    }
}
module.exports = {User};
