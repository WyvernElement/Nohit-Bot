class User{
    ID;
    OwnedNohits = new Map();
    Playlists = new Map();
    Language;

    constructor(id){
        this.ID = id
    }
    
    async addNohit(nohitID, difficulty){
        let journey = new Journey();
        if (this.OwnedNohits.has(difficulty)) {
            journey = this.OwnedNohits.get(difficulty);
        }
        if (!journey.NohitIDs.includes(nohitID)) {
            journey.NohitIDs.push(nohitID);
            this.OwnedNohits.set(difficulty, journey);
        }
    }

    async addPlaylist(link, difficulty){
        this.Playlists.set(difficulty, link);
    }
}
module.exports = {User};

const NohitService = require("../service/NohitService.js");
class Journey{
    NohitIDs;
    get Total(){
        return this.NohitIDs.length;
    }
    V;
    DQ;
    Pending;

    constructor(){
        this.NohitIDs = [];
        this.V = 0;
        this.DQ = 0;
        this.Pending = 0;
    }

    update(){
        this.V = 0;
        this.DQ = 0;
        this.Pending = 0;
        for (const nohit in this.NohitIDs){
            const v = NohitService.lookup(nohit).Verification;
            if (v === "Verified"){
                this.V++;
            }
            else if (v === "Disqualified"){
                this.DQ++;
            }
            else{
                this.Pending++;
            }
        }
    }
}