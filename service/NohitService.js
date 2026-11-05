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
        this.addJourneyAssociation();
    }

    async addJourneyAssociation(){
        for (const [id, journey] of this.nohitData.journeys){
            const user = await this.userData.getUser(journey.UserID);
            await user.addJourney(journey.Difficulty, id);
        }
    }
    
    async lookup(guildId, id){
        const nohit = await this.nohitData.getNohit(guildId, id);
        return nohit;
    }

    async lookupByBoss(guildId, userId, difficulty, boss){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const bossName = this.nohitData.getBoss(guildId, boss) ?? boss;
        const nohit = await this.nohitData.getNohitByData(guildId, userId, difficultyName, bossName);
        return nohit;
    }

    async lookupJourney(guildId, id){
        const journey = await this.nohitData.getJourney(guildId, id);
        return journey;
    }

    async lookupByUser(guildId, userId, difficulty){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const journey = await this.nohitData.getJourneyByData(guildId, userId, difficultyName);
        return journey;
    }

    async submit(guildId, userId, difficulty, boss, url, comment){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        if (!resolved) {
            return undefined; //mmm I should change this to be something specific for the text
        }
        const bossName = this.nohitData.getBoss(guildId, boss) ?? boss;
        if (!resolved.base.hasBoss(bossName)) {
            return undefined; //this one too
        }
        const existingNohit = await this.lookupByBoss(guildId, userId, difficulty, boss);
        const id = existingNohit ? existingNohit.ID : (await this.totalNohits(guildId)) + 1;
        const newNohit = new Nohit(id, userId, resolved.standard, bossName, url, comment);
        const user = await this.userData.getUser(guildId, userId);
        const journey = await this.nohitData.getJourneyByData(guildId, userId, resolved.standard);
        journey.addNohit(guildId, id);
        await this.nohitData.submitNohit(guildId, newNohit);
        await this.userData.updateUser(guildId, userId, user);
        return newNohit;
    }

    async recomment(guildId, id, newComment){
        const nohit = await this.nohitData.getNohit(guildId, id);
        nohit.UserComment = newComment;
        this.nohitData.submitNohit(guildId, nohit);
    }

    async deleteNohit(guildId, id, difficulty, boss){
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

    async totalNohits(guildId){
        return this.nohitData.getTotal(guildId);
    }

    resolveDifficulty(guildId, difficultyText){
        if (typeof difficultyText !== "string" || difficultyText.trim() === "") {
            return undefined;
        }
        const parts = difficultyText.split("-").map(part => part.trim()).filter(Boolean);
        if (parts.length === 0) {
            return undefined;
        }
        const difficulties = parts.map(part => this.findDifficulty(guildId, part));
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

    findDifficulty(guildId, token){
        const direct = this.nohitData.getDifficulty(guildId, token);
        if (direct) {
            return direct;
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === token) {
                return difficulty;
            }
        }
        return undefined;
    }

    createDifficulty(guildId, name, abbreviation, isModifier){
        if (typeof name !== "string" || name.trim() === "") {
            return undefined;
        }
        if (typeof abbreviation !== "string" || abbreviation.trim() === "") {
            return undefined;
        }
        const trimmedName = name.trim();
        const trimmedAbbrev = abbreviation.trim();
        if (this.nohitData.getDifficulty(guildId, trimmedName)) {
            return { conflict: "name" };
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === trimmedAbbrev) {
                return { conflict: "abbreviation" };
            }
        }
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, Boolean(isModifier));
        this.nohitData.addDifficulty(guildId, difficulty);
        return difficulty;
    }

    async addBoss(guildId, difficultyToken, bossName){
        if (typeof bossName !== "string" || bossName.trim() === "") {
            return undefined;
        }
        const difficulty = this.findDifficulty(guildId, difficultyToken);
        if (!difficulty || difficulty.isModifier) {
            return undefined;
        }
        const trimmedBoss = bossName.trim();
        if (difficulty.hasBoss(trimmedBoss)) {
            return { duplicate: true };
        }
        difficulty.addBoss(trimmedBoss);
        await this.nohitData.saveDifficulties(guildId);
        return difficulty;
    }

    async getUser(id){

    }

}
const service = new NohitService();
module.exports = service;
module.exports.NohitService = NohitService;
