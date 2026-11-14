const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");
const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const { Nohit } = require("../objects/Nohit");
const { Difficulty } = require("../objects/Difficulty");
const { Boss } = require("../objects/Boss");
const {Journey} = require("../objects/Journey");

class NohitService {

    constructor(
        nohitData = new JsonNohitDataAccess(),
        userData = new JsonUserDataAccess()
    ) {
        this.nohitData = nohitData;
        this.userData = userData;
        for (const [guild, journeys] of nohitData.journeys){
            this.addJourneyAssociation(guild);
        }
    }

    async addJourneyAssociation(guildId){
        for (const [id, journey] of this.nohitData.journeys.get(guildId)){
            const user = await this.userData.getUser(guildId, journey.UserID);
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
        const resolvedBoss = resolved ? this.resolveBoss(guildId, resolved.base, boss) : undefined;
        const bossName = resolvedBoss?.textName ?? this.nohitData.getBoss(guildId, boss) ?? boss;
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
        const resolvedBoss = this.resolveBoss(guildId, resolved.base, boss);
        if (!resolvedBoss) {
            return undefined; //this one too
        }
        const existingNohit = await this.lookupByBoss(guildId, userId, difficulty, boss);
        const id = existingNohit ? existingNohit.ID : (await this.totalNohits(guildId)) + 1;
        const newNohit = new Nohit(id, userId, resolved.standard, resolvedBoss.textName, url, comment);
        const user = await this.userData.getUser(guildId, userId);
        let journey = await this.nohitData.getJourneyByData(guildId, userId, resolved.standard);
        if(!journey){
            journey = new Journey((await this.nohitData.totalJourneys(guildId)) + 1, userId, resolved.standard);
        }
        journey.addNohit(id, newNohit.Special);
        await this.nohitData.submitNohit(guildId, newNohit);
        await this.nohitData.updateJourney(guildId, journey);
        await this.userData.updateUser(guildId, userId, user);
        return newNohit;
    }

    async recomment(guildId, id, newComment){
        const nohit = await this.nohitData.getNohit(guildId, id);
        nohit.UserComment = newComment;
        await this.nohitData.submitNohit(guildId, nohit);
    }

    async deleteNohit(guildId, id, difficulty, boss){
        //returns String
    }

    async updateJourneys(guildId){ //need to fix this so it will persist
        for (const [id, journey] of this.nohitData.journeys.get(guildId)){
            journey.V = 0;
            journey.DQ = 0;
            journey.Pending = 0;
            for (const id of journey.NohitIDs){
                const nohit = await this.lookup(guildId, id);
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

    resolveBoss(guildId, difficulty, token){
        if (!difficulty || typeof token !== "string") {
            return undefined;
        }
        const aliased = this.nohitData.getBoss(guildId, token);
        const names = aliased ? [token, aliased] : [token];
        return difficulty.bosses?.find(boss => names.includes(boss.name) || names.includes(boss.textName));
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
            if (difficulty.abbreviation === token.toLowerCase() || difficulty.name.toLowerCase() === token.toLowerCase()) {
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

    copyDifficulty(guildId, name, abbreviation, otherDifficulty){
        if (typeof name !== "string" || name.trim() === ""){
            return undefined;
        }
        if(typeof abbreviation !== "string" || abbreviation.trim() === ""){
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
        const otherDiff = this.findDifficulty(guildId, otherDifficulty);
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, false);
        difficulty.copyAdd(otherDiff);
        this.nohitData.addDifficulty(guildId, difficulty);
        return difficulty;
    }

    async addBoss(guildId, difficultyToken, bossName, order, textName){
        if (typeof bossName !== "string" || bossName.trim() === "") {
            return undefined;
        }
        if (typeof textName !== "string" || textName.trim() === "") {
            return undefined;
        }
        const progressionOrder = Number(order);
        if (!Number.isFinite(progressionOrder)) {
            return undefined;
        }
        const difficulty = this.findDifficulty(guildId, difficultyToken);
        if (!difficulty || difficulty.isModifier) {
            return undefined;
        }
        const trimmedBossName = bossName.trim();
        if (difficulty.hasBoss(trimmedBossName)) {
            return { duplicate: true };
        }
        const boss = new Boss(trimmedBossName, progressionOrder, textName.trim());
        difficulty.addBoss(boss);
        await this.nohitData.saveDifficulties(guildId);
        return difficulty;
    }

}
const service = new NohitService();
module.exports = service;
module.exports.NohitService = NohitService;
