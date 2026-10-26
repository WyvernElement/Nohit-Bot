class User{
    ID;
    OwnedNohits = new Map();
    Language;

    constructor(id){
        this.ID = id
    }
    
    async addNohit(nohitID, difficulty){
        let idList = [];
        if (this.OwnedNohits.has(difficulty)) {
            idList = this.OwnedNohits.get(difficulty);
        }
        if (!idList.includes(nohitID)) {
            idList.push(nohitID);
            this.OwnedNohits.set(difficulty, idList);
        }
    }
}
module.exports = {User};
