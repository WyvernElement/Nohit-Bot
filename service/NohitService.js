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

    async lookupReview(guildId, id){
        return await this.nohitData.getReview(guildId, id);
    }

    async catalogue(guildId, difficulty, boss, count, verified){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const resolvedBoss = resolved ? this.resolveBoss(guildId, resolved.base, boss) : undefined;
        const bossName = resolvedBoss?.textName ?? this.nohitData.getBoss(guildId, boss) ?? boss;
        const nohitCatalogue = await this.nohitData.catalogue(guildId, difficultyName, bossName, count, verified);
        return nohitCatalogue;
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

    async updateJourneys(guildId){
        for (const [id, journey] of this.nohitData.journeys.get(guildId)){
            journey.V = 0;
            journey.DQ = 0;
            journey.Pending = 0;
            journey.Deleted = 0;
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
                if (nohit.UserComment === "Deleted"){
                    journey.Deleted++
                }
            }
            const resolved = this.resolveDifficulty(guildId, journey.Difficulty);
            const difficulty = resolved ? resolved.base : this.findDifficulty(guildId, journey.Difficulty);
            if (difficulty && journey.NohitIDs.length >= difficulty.bosses.filter(boss => boss.textName != "Boss Rush").length){
                journey.Completed = true;
            }
        }
    }

    async stats(guildId){
        await this.updateJourneys(guildId);
        
        let Stats = {
            V: 0,
            DQ: 0,
            P: 0,
            D: 0,
            T: 0
        };
        const Bosses = new Map();
        const Diffs = new Map();
        for (const nohit of this.nohitData.nohits.get(guildId).values()){
            if (!Bosses.has(nohit.Boss)){
                Bosses.set(nohit.Boss,{
                    V: 0,
                    DQ: 0,
                    P: 0,
                    D: 0,
                    T: 0
                });
            }
            const boss = Bosses.get(nohit.Boss);
            if (!Diffs.has(nohit.Difficulty)){
                Diffs.set(nohit.Difficulty,{
                    V: 0,
                    DQ: 0,
                    P: 0,
                    D: 0,
                    T: 0
                });
            }
            const diff = Diffs.get(nohit.Difficulty);

            switch (nohit.Verification){
                case "Verified":
                    Stats.V++;
                    boss.V++;
                    diff.V++;
                    break;
                case "Disqualified":
                    Stats.DQ++;
                    boss.DQ++;
                    diff.DQ++;
                    break;
                case "Pending":
                    Stats.P++;
                    boss.P++;
                    diff.P++;
                    break;
            }
            
            if (nohit.UserComment === "Deleted"){
                Stats.D++;
            }
            else{
                boss.T++;
                diff.T++;
            }
            Stats.T++;
        }
        return { Stats, Bosses, Diffs }
    }

    async totalNohits(guildId){
        return this.nohitData.getTotal(guildId);
    }

    resolveBoss(guildId, difficulty, token){
        if (!difficulty || typeof token !== "string") {
            return undefined;
        }
        const lowerName = token.toLowerCase().replaceAll(' ', '');
        const aliased = this.nohitData.getBoss(guildId, lowerName);
        const names = aliased ? [token, lowerName, aliased] : [token, lowerName];
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
        const difficulties = parts.map(part => this.findDifficulty(guildId, part, true));
        if (difficulties.some(difficulty => difficulty === undefined)) {
            return undefined;
        }
        let mix = difficulties.filter(parsed => parsed.modifier);
        let bases = difficulties.filter(difficulty => !difficulty.isModifier && !difficulty.diff && !difficulty.modifier);
        let modifiers = difficulties.filter(difficulty => difficulty.isModifier);
        if (mix.length > 0){
            if (bases.length === 0){
                bases = [mix.shift().diff, ...bases];
                modifiers = [...mix.flatMap(parsed => parsed.modifier), ...modifiers];
            }
            else{
                modifiers = [...mix.flatMap(parsed => parsed.modifier), ...modifiers];
            }
            if (modifiers.some(mod => modifiers.indexOf(mod) != modifiers.lastIndexOf(mod))){
                return undefined;
            }
        }
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

    findDifficulty(guildId, token, mod){
        const direct = this.nohitData.getDifficulty(guildId, token);
        if (direct) {
            return direct;
        }
        let modifier;
        let diff;
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === token.toLowerCase()) {
                if (mod){
                    if (difficulty.isModifier){
                        modifier = difficulty;
                    }
                    else{
                        diff = difficulty;
                    }
                }
                else{
                    return difficulty
                }
            }
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.name.toLowerCase().includes(token.toLowerCase())) {
                if (mod){
                    diff = difficulty;
                }
                else{
                    return difficulty;
                }
            }
        }
        if (mod){
            if (!modifier){
                return diff;
            }
            if (!diff){
                return modifier;
            }
            return { diff, modifier };
        }
        return undefined;
    }

    checkJudge(guildId, id){
        return this.userData.getJudge(guildId, id) ?? false;
    }

    createDifficulty(guildId, name, abbreviation, isModifier, bias){
        if (typeof name !== "string" || name.trim() === "") {
            return undefined;
        }
        if (typeof abbreviation !== "string" || abbreviation.trim() === "") {
            return undefined;
        }
        const trimmedName = name.trim();
        const trimmedAbbrev = abbreviation.trim().toLowerCase();
        if (this.nohitData.getDifficulty(guildId, trimmedName)) {
            return { conflict: "name" };
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === trimmedAbbrev) {
                return { conflict: "abbreviation" };
            }
        }
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, Boolean(isModifier), bias);
        this.nohitData.addDifficulty(guildId, difficulty);
        return difficulty;
    }

    copyDifficulty(guildId, name, abbreviation, otherDifficulty, bias){
        if (typeof name !== "string" || name.trim() === ""){
            return undefined;
        }
        if(typeof abbreviation !== "string" || abbreviation.trim() === ""){
            return undefined;
        }
        const trimmedName = name.trim();
        const trimmedAbbrev = abbreviation.trim().toLowerCase();
        if (this.nohitData.getDifficulty(guildId, trimmedName)) {
            return { conflict: "name" };
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === trimmedAbbrev) {
                return { conflict: "abbreviation" };
            }
        }
        const otherDiff = this.findDifficulty(guildId, otherDifficulty);
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, false, bias);
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
        const trimmedBossName = bossName.trim().toLowerCase();
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
