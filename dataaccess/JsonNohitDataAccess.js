const fs = require("fs");
const path = require("path");
const { Nohit } = require("../objects/Nohit");
const { Journey } = require ("../objects/Journey");
const { Difficulty } = require ("../objects/Difficulty");
class JsonNohitDataAccess {

    constructor(
        nohitsJsonPath = path.join(__dirname, "../Backup/NohitsData.json"),
        journeysJsonPath = path.join(__dirname, "../Backup/JourneysData.json"),
        difficultiesJsonPath = path.join(__dirname, "../Backup/DifficultiesData.json"),
        aliasesJsonPath = path.join(__dirname, "../Backup/AliasesData.json")
    ) {
        this.nohitsJsonPath = nohitsJsonPath;
        this.journeysJsonPath = journeysJsonPath;
        this.difficultiesJsonPath = difficultiesJsonPath;
        this.aliasesJsonPath = aliasesJsonPath;
        this.nohits = this.importNohits();
<<<<<<< HEAD
        //this.journeys = this.importJourneys();
=======
        this.journeys = this.importJourneys();
>>>>>>> 2bd79bfd7c631eb6bde63e42164b80695ffe3ead
        this.difficulties = this.importDifficulties();
        this.aliases = this.importAliases();
    }

    importNohits() {
        if (fs.existsSync(this.nohitsJsonPath)) {
            const rawJson = fs.readFileSync(this.nohitsJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const nohitMap = new Map();
            for (const item of parsedJson) {
                nohitMap.set(item.ID, Object.assign(new Nohit(), item));
                const nohit = Object.assign(new Nohit(), item);
                //const journey = this.createOrGetJourney(nohit.UserID, nohit.Difficulty);
                //journey.addNohit(nohit.ID);
                nohitMap.set(item.ID, nohit);
            }
            return nohitMap;
        }
        return new Map();
    }

    importJourneys() {
        if(fs.existsSync(this.journeysJsonPath)){
            const rawJson = fs.readFileSync(this.journeysJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3')); // idk how to format this
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
            if (!Array.isArray(parsedJson)) {
                return new Map();
            }
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

    async buildJourneysFromNohitBotv2(){
        for (const [id, nohit] of this.nohits){
            let journey = await this.getJourneyByData(nohit.UserID, nohit.Difficulty)
            if (journey === undefined) {
                journey = new Journey(this.journeys.size + 1, nohit.UserID, nohit.Difficulty);
            }
            journey.addNohit(nohit.ID);
            this.journeys.set(journey.ID, journey);
        }
        const playlistsJsonPath = path.join(__dirname, "../Backup/PlaylistsData.json");
        if(fs.existsSync(playlistsJsonPath)){
            const rawJson = fs.readFileSync(playlistsJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            for (const item of parsedJson) {
                const journey = await this.getJourneyByData(item.UserID, item.Difficulty);
                if (journey != undefined){
                    journey.setPlaylist(item.Url);
                }
            }
        }
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

    async getJourney(id) {
        const numericId = Number(id);
        return this.journeys.get(numericId);
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

    getTotal(){
        return this.nohits.size;
    }

    async saveNohits(){
        const items = Array.from(this.nohits.values());
        fs.writeFileSync(this.nohitsJsonPath, JSON.stringify(items, null, 2));
    }

    async saveJourneys(){
        fs.writeFileSync(this.journeysJsonPath, JSON.stringify(this.journeys, null, 2));
    }

    async saveAliases(){
        const items = Array.from(this.aliases.entries()).map(([alias, boss]) => ({ alias, boss }));
        fs.writeFileSync(this.aliasesJsonPath, JSON.stringify(items, null, 2));
    }

    async saveDifficulties(){
        const items = Array.from(this.difficulties.values());
        fs.writeFileSync(this.difficultiesJsonPath, JSON.stringify(items, null, 2));
    }

}
module.exports = JsonNohitDataAccess;
