class User{
    ID;
    OwnedNohits = new Map();
    Language;

    constructor(id){
        this.ID = id
    }
    
    async addNohit(nohitID, difficulty){
        const idList = [];
        if (OwnedNohits.has(difficulty)) {
            idList = OwnedNohits.get(difficulty);
        }
        if (!idList.includes(nohitID)) {
            idList.push(nohitID);
            OwnedNohits.set(difficulty, idList);
        }
    }
}
