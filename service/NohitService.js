const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");
const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const { Nohit } = require("../objects/Nohit");
const { Journey } = require("../objects/Journey");

class NohitService {

    constructor(
        nohitData = new JsonNohitDataAccess(),
        userData = new JsonUserDataAccess()
    ) {
        this.nohitData = nohitData;
        this.userData = userData;
        this.addJourneyAssociation();
    }

    async addJourneyAssociation(){
        for (const [id, journey] of this.nohitData.journeys){
            const user = await this.userData.getUser(journey.UserID);
            await user.addJourney(journey.Difficulty, id);
        }
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

    async lookupJourney(id){
        const journey = await this.nohitData.getJourney(id);
        return journey;
    }

    async lookupByUser(userId, difficulty){
        const resolved = this.resolveDifficulty(difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const journey = await this.nohitData.getJourneyByData(userId, difficultyName);
        return journey;
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
        const journey = this.nohitData.createOrGetJourney(userId, resolved.standard);
        await journey.addNohit(id);
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

    async updateJourneys(){
        for (const [id, journey] of this.nohitData.journeys){
            journey.V = 0;
            journey.DQ = 0;
            journey.Pending = 0;
            for (const id of journey.NohitIDs){
                const nohit = await this.lookup(id);
                switch (nohit.Verification){
                case "Verified":
                    journey.V++;
                    break;
                case "Disqualified":
                    journey.DQ++;
                    break;
                case "Pending":
                    journey.Pending++;
                    break;
                }
            }
        }
    }

    async totalNohits(){
        return this.nohitData.getTotal();
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
