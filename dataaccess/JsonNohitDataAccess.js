const fs = require("fs");
const path = require("path");
const { Nohit } = require("../objects/Nohit");
const { Journey } = require("../objects/Journey");
const { Difficulty } = require ("../objects/Difficulty");
const { NohitService } = require("../service/NohitService");
class JsonNohitDataAccess {

    constructor(
        nohitsJsonPath = path.join(__dirname, "../Backup/NohitsData.json"),
        difficultiesJsonPath = path.join(__dirname, "../Backup/DifficultiesData.json"),
        aliasesJsonPath = path.join(__dirname, "../Backup/AliasesData.json")
    ) {
        this.nohitsJsonPath = nohitsJsonPath;
        this.difficultiesJsonPath = difficultiesJsonPath;
        this.aliasesJsonPath = aliasesJsonPath;
        this.nohits = this.importNohits();
        this.journeys = this.importJourneys();
        this.difficulties = this.importDifficulties();
        this.aliases = this.importAliases();
    }

    importNohits() {
        if (fs.existsSync(this.nohitsJsonPath)) {
            const rawJson = fs.readFileSync(this.nohitsJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const nohitMap = new Map();
            for (const item of parsedJson) {
                const nohit = Object.assign(new Nohit(), item);
                const journey = this.createOrGetJourney(nohit.UserID, nohit.Difficulty);
                journey.addNohit(nohit.ID);
                nohitMap.set(item.ID, nohit);
            }
            return nohitMap;
        }
        return new Map();
    }

    importJourneys(){
        if (fs.existsSync(this.journeysJsonPath)){
            const rawJson = fs.readFileSync(this.journeysJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson) // i don't know how we're formatting this, so i'll leave it empty for now
            const journeyMap = new Map();
            for (const item of parsedJson) {
                journeyMap.set(item.ID, Object.assign(new Journey(), item));
            }
            return journeyMap;
        }
        return new Map();
    }

    importDifficulties(){
        if(fs.existsSync(this.difficultiesJsonPath)){
            const rawJson = fs.readFileSync(this.difficultiesJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const difficultyMap = new Map();
            for (const item of parsedJson) {
                difficultyMap.set(item.name, Object.assign(new Difficulty(), item));
            }
            return difficultyMap;
        }
        return new Map();
    }

    importAliases(){
        if(fs.existsSync(this.aliasesJsonPath)){
            const rawJson = fs.readFileSync(this.aliasesJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const aliasMap = new Map();
            for (const item of parsedJson) {
                aliasMap.set(item.alias, item.boss);
            }
            return aliasMap;
        }
        return new Map();
    }

    addAlias(alias, boss){
        this.aliases.set(alias, boss);
        this.saveAliases();
    }

    getBoss(alias){
        return this.aliases.get(alias);
    }

    getDifficulty(name){
        return this.difficulties.get(name);
    }

    addDifficulty(difficulty){
        this.difficulties.set(difficulty.name, difficulty);
        this.saveDifficulties();
    }

    async submitNohit(nohit){
        this.nohits.set(nohit.ID, nohit);
        this.saveNohits();
    }

    async getNohit(id) {
        const numericId = Number(id);
        return this.nohits.get(numericId);
    }

    async getNohitByData(userId, difficulty, boss){
        let match;
        for (const nohit of this.nohits.values()) {
            const sameUser = String(nohit.UserID) === String(userId);
            const sameDifficulty = nohit.Difficulty === difficulty;
            const sameBoss = nohit.Boss === boss;
            if (sameUser && sameDifficulty && sameBoss) {
                if (!match || Number(nohit.ID) > Number(match.ID)) {
                    match = nohit;
                }
            }
        }
        return match;
    }

    async getJourney(id){
        const numericId = Number(id);
        return this.journeys.get(id)
    }

    async getJourneyByData(userId, difficulty){
        for (const journey of this.journeys.values()) {
            const sameUser = String(nohit.UserID) === String(userId);
            const sameDifficulty = nohit.Difficulty === difficulty;
            if (sameUser && sameDifficulty) {
                return journey;
            }
        }
        return undefined;
    }

    async createOrGetJourney(userId, difficulty){
        const journey = this.getJourneyByData(userId, difficulty)
        if (journey === undefined) {
            journey = new Journey(await this.getTotal(), userId, difficulty)
            await NohitService.userData.getUser(userId).addJourney(journey.ID, journey);
        }
        return journey;
    }

    async getTotal(){
        return this.nohits.size;
    }

    async saveNohits(){
        fs.writeFileSync(this.nohitsJsonPath, JSON.stringify(this.nohits, null, 2));
    }

    async saveAliases(){
        fs.writeFileSync(this.aliasesJsonPath, JSON.stringify(this.aliases, null, 2));
    }

    async saveDifficulties(){
        fs.writeFileSync(this.difficultiesJsonPath, JSON.stringify(this.difficulties, null, 2));
    }

}
module.exports = JsonNohitDataAccess;
