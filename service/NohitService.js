const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");
const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const { Nohit } = require("../objects/Nohit");
const { User } = require("../objects/User");

class NohitService {

    constructor(
        nohitData = new JsonNohitDataAccess(),
        userData = new JsonUserDataAccess()
    ) {
        this.nohitData = nohitData;
        this.userData = userData;
    }
    
    async lookup(id){
        const nohit = await this.nohitData.getNohit(id);
        return nohit;
    }

    async lookupByBoss(userId, difficulty, boss){
        const resolved = this.resolveDifficulty(difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const bossName = this.nohitData.getBoss(boss) ?? boss;
        const nohit = await this.nohitData.getNohitByData(userId, difficultyName, bossName);
        return nohit;
    }

    async submit(userId, difficulty, boss, url, comment){
        const resolved = this.resolveDifficulty(difficulty);
        if (!resolved) {
            return undefined; //mmm I should change this to be something specific for the text
        }
        const bossName = this.nohitData.getBoss(boss) ?? boss;
        if (!resolved.base.hasBoss(bossName)) {
            return undefined; //this one too
        }
        const existingNohit = await this.lookupByBoss(userId, difficulty, boss);
        const id = existingNohit ? existingNohit.ID : (await this.totalNohits()) + 1;
        const newNohit = new Nohit(id, userId, resolved.standard, bossName, url, comment);
        const user = this.userData.getUser(userId);
        await user.addNohit(id, resolved.standard);
        await this.nohitData.submitNohit(newNohit);
        await this.userData.updateUser(userId, user);
        return newNohit;
    }

    async recomment(id, newComment){
        const nohit = await this.nohitData.getNohit(id);
        nohit.UserComment = newComment;
        this.nohitData.submitNohit(nohit);
    }

    async deleteNohit(id, difficulty, boss){
        //returns String
    }

    async totalNohits(){
        return await this.nohitData.getTotal();
    }

    resolveDifficulty(difficultyText){
        if (typeof difficultyText !== "string" || difficultyText.trim() === "") {
            return undefined;
        }
        const parts = difficultyText.split("-").map(part => part.trim()).filter(Boolean);
        if (parts.length === 0) {
            return undefined;
        }
        const difficulties = parts.map(part => this.findDifficulty(part));
        if (difficulties.some(difficulty => difficulty === undefined)) {
            return undefined;
        }
        const bases = difficulties.filter(difficulty => !difficulty.isModifier);
        const modifiers = difficulties.filter(difficulty => difficulty.isModifier);
        if (bases.length !== 1) {
            return undefined;
        }
        const base = bases[0];
        for (const modifier of modifiers) {
            if (!base.allowedModifiers.includes(modifier.name)) {
                return undefined;
            }
        }
        const orderedModifiers = base.allowedModifiers.filter(name =>
            modifiers.some(modifier => modifier.name === name)
        );
        const standard = [...orderedModifiers, base.name].join("-");
        return { base, standard };
    }

    findDifficulty(token){
        const direct = this.nohitData.getDifficulty(token);
        if (direct) {
            return direct;
        }
        for (const difficulty of this.nohitData.difficulties.values()) {
            if (difficulty.abbreviation === token) {
                return difficulty;
            }
        }
        return undefined;
    }

    async getUser(id){

    }

}
const service = new NohitService();
module.exports = service;
module.exports.NohitService = NohitService;
