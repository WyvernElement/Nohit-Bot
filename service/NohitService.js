const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");

class NohitService {

    constructor() {
        this.nohitData = new JsonNohitDataAccess();
    }
    
    async lookup(id){
        const nohit = await this.nohitData.getNohit(id);
        return nohit;
    }

    async submit(difficulty, boss, url, comment){
        //returns String
    }

    async recomment(id, newComment){
        //returns String
    }

    async deleteNohit(id, difficulty, boss){
        //returns String
    }

    async totalNohits(){
        //returns number
    }

}
module.exports = new NohitService();
