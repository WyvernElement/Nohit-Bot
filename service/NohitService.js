const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");
const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const { Nohit } = require("../objects/Nohit");
const { Journey } = require("../objects/Journey");
const { User } = require("../objects/User");
const { Difficulty } = require("../objects/Difficulty");

class NohitService {

    constructor(
        nohitData = new JsonNohitDataAccess(),
        userData = new JsonUserDataAccess()
    ) {
        this.nohitData = nohitData;
        this.userData = userData;
        this.journeys = new Map();
        this.buildJourneys();
    }

    async buildJourneys(){
        for (const [id, nohit] of this.nohitData.nohits){
            let journey = await this.getJourneyByData(nohit.UserID, nohit.Difficulty)
            if (journey === undefined) {
                journey = new Journey(this.journeys.size + 1, nohit.UserID, nohit.Difficulty);
                await this.userData.getUser(nohit.UserID).addJourney(journey.Difficulty, journey.ID);
            }
            journey.addNohit(nohit.ID);
            this.journeys.set(journey.ID, journey);
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
        this.journeys = new Map();
        await this.buildJourneys(); // holy shit. placeholder because the actual function doesn't work without an await but you can't put that in a constructor
        
        const journey = await this.journeys.get(Number(id));
        return journey;
    }

    async lookupByUser(userId, difficulty){
        this.journeys = new Map();
        await this.buildJourneys(); // holy shit. placeholder because the actual function doesn't work without an await but you can't put that in a constructor
        
        const resolved = this.resolveDifficulty(difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const journey = await this.getJourneyByData(userId, difficultyName);
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
    
    async getJourneyByData(userId, difficulty){
        for (const journey of this.journeys.values()) {
            const sameUser = String(journey.UserID) === String(userId);
            const sameDifficulty = journey.Difficulty === difficulty;
            if (sameUser && sameDifficulty) {
                return journey;
            }
        }
        return undefined;
    }

    async createOrGetJourney(userId, difficulty){

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
        for (const [id, journey] of this.journeys){
            journey.V = 0;
            journey.DQ = 0;
            journey.Pending = 0;
            for (const nohit of journey.NohitIDs){
                const v = await this.lookup(nohit).Verification;
                if (v === "Verified"){
                    journey.V++;
                }
                else if (v === "Disqualified"){
                    journey.DQ++;
                }
                else{
                    journey.Pending++;
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

    createDifficulty(name, abbreviation, isModifier){
        if (typeof name !== "string" || name.trim() === "") {
            return undefined;
        }
        if (typeof abbreviation !== "string" || abbreviation.trim() === "") {
            return undefined;
        }
        const trimmedName = name.trim();
        const trimmedAbbrev = abbreviation.trim();
        if (this.nohitData.getDifficulty(trimmedName)) {
            return { conflict: "name" };
        }
        for (const difficulty of this.nohitData.difficulties.values()) {
            if (difficulty.abbreviation === trimmedAbbrev) {
                return { conflict: "abbreviation" };
            }
        }
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, Boolean(isModifier));
        this.nohitData.addDifficulty(difficulty);
        return difficulty;
    }

    async addBoss(difficultyToken, bossName){
        if (typeof bossName !== "string" || bossName.trim() === "") {
            return undefined;
        }
        const difficulty = this.findDifficulty(difficultyToken);
        if (!difficulty || difficulty.isModifier) {
            return undefined;
        }
        const trimmedBoss = bossName.trim();
        if (difficulty.hasBoss(trimmedBoss)) {
            return { duplicate: true };
        }
        difficulty.addBoss(trimmedBoss);
        await this.nohitData.saveDifficulties();
        return difficulty;
    }

    async getUser(id){

    }

}
const service = new NohitService();
module.exports = service;
module.exports.NohitService = NohitService;
