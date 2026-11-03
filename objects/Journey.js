class Journey{
    ID;
    UserID;
    Difficulty;
    NohitIDs;
    get Total(){
        return this.NohitIDs.length;
    }
    V;
    DQ;
    Pending;

    constructor(id, userid, difficulty){
        this.ID = id;
        this.UserID = userid;
        this.Difficulty = difficulty;
        this.NohitIDs = [];
        this.V = 0;
        this.DQ = 0;
        this.Pending = 0;
    }

    addNohit(id){
        if (!this.NohitIDs.includes(id)){
            this.NohitIDs.push(id);
        }
    }
}
module.exports = {Journey}
