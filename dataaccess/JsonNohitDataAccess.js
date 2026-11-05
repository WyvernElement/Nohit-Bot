const fs = require("fs");
const path = require("path");
const { Nohit } = require("../objects/Nohit");
const { Journey } = require ("../objects/Journey");
const { Difficulty } = require ("../objects/Difficulty");
class JsonNohitDataAccess {

    constructor(
        dataFolderPath = path.join(__dirname, "../Data"),
        nohitsJsonPath = "/Backup/NohitsData.json",
        journeysJsonPath = "/Backup/JourneysData.json",
        difficultiesJsonPath = "/Backup/DifficultiesData.json",
        aliasesJsonPath = "../Backup/AliasesData.json"
    ) {
        this.dataFolderPath = dataFolderPath;
        this.nohitsJsonPath = nohitsJsonPath;
        this.journeysJsonPath = journeysJsonPath;
        this.difficultiesJsonPath = difficultiesJsonPath;
        this.aliasesJsonPath = aliasesJsonPath;
        this.nohits = this.importNohits();
        this.journeys = this.importJourneys();
        this.difficulties = this.importDifficulties();
        this.aliases = this.importAliases();
    }

    getSubfolders(){
        return fs.readdirSync(this.dataFolderPath, {withFileTypes: true})
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name);
    }

    nohitPath(id){
        return path.join(this.dataFolderPath, id, this.nohitsJsonPath);
    }

    journeyPath(id){
        return path.join(this.dataFolderPath, id, this.journeysJsonPath);
    }

    difficultyPath(id){
        return path.join(this.dataFolderPath, id, this.difficultiesJsonPath);
    }

    aliasPath(id){
        return path.join(this.dataFolderPath, id, this.aliasesJsonPath);
    }

    playlistPath(id){
        return path.join(this.dataFolderPath, id, "/Backup/PlaylistsData.json");
    }



    importNohits() {
        const nohitsMap = new Map();
        for(const id of this.getSubfolders()){
            if (fs.existsSync(this.nohitPath(id))) {
                const rawJson = fs.readFileSync(this.nohitPath(id), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const nohitMap = new Map();
                for (const item of parsedJson) {
                    const nohit = Object.assign(new Nohit(), item);
                    nohitMap.set(item.ID, nohit);
                }
                nohitsMap.set(id, nohitMap);
            }
            else{
                nohitsMap.set(id, new Map());
            }
        }
        return nohitsMap;
    }

    importJourneys() {
        const journeysMap = new Map();
        for(const id of this.getSubfolders()){
            if (fs.existsSync(this.journeyPath(id))) {
                const rawJson = fs.readFileSync(this.journeyPath(id), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const journeyMap = new Map();
                for (const item of parsedJson) {
                    const journey = Object.assign(new Journey(), item);
                    journeyMap.set(item.ID, journey);
                }
                journeysMap.set(id, journeyMap);
            }
            else{
                journeysMap.set(id, new Map());
            }
        }
        return journeysMap;
    }

    importDifficulties() {
        const difficultiesMap = new Map();
        for(const id of this.getSubfolders()){
            if (fs.existsSync(this.difficultyPath(id))) {
                const rawJson = fs.readFileSync(this.difficultyPath(id), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const difficultyMap = new Map();
                for (const item of parsedJson) {
                    const difficulty = Object.assign(new Difficulty(), item);
                    difficultyMap.set(item.ID, difficulty);
                }
                difficultiesMap.set(id, difficultyMap);
            }
            else{
                difficultiesMap.set(id, new Map());
            }
        }
        return difficultiesMap;
    }



    importAliases(){
        const aliasesMap = new Map();
        for(const id of this.getSubfolders()){
            if(fs.existsSync(this.aliasPath(id))){
                const rawJson = fs.readFileSync(this.aliasPath(id), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const aliasMap = new Map();
                for (const item of parsedJson) {
                    aliasMap.set(item.alias, item.boss);
                }
                aliasesMap.set(id, aliasMap);
            }
            else{
                aliasesMap.set(id, new Map());
            }
        }
        return aliasesMap;
    }

    async buildJourneysFromNohitBotv2(guildId){
        for (const [id, nohit] of this.nohits.get(guildId)){
            let journey = await this.getJourneyByData(guildId, nohit.UserID, nohit.Difficulty)
            if (journey === undefined) {
                journey = new Journey(this.journeys.get(guildId).size + 1, nohit.UserID, nohit.Difficulty);
            }
            journey.addNohit(nohit.ID);
            this.journeys.get(guildId).set(journey.ID, journey);
        }
        const playlistsJsonPath = this.playlistPath(guildId);
        if(fs.existsSync(playlistsJsonPath)){
            const rawJson = fs.readFileSync(playlistsJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            for (const item of parsedJson) {
                const journey = await this.getJourneyByData(guildId, item.UserID, item.Difficulty);
                if (journey != undefined){
                    journey.setPlaylist(item.Url);
                }
            }
        }
        this.saveJourneys(guildId);
    }

    addAlias(guildId, alias, boss){
        this.aliases.get(guildId).set(alias, boss);
        this.saveAliases(guildId);
    }

    getBoss(guildId, alias){
        return this.aliases.get(guildId).get(alias);
    }

    getDifficulty(guildId, name){
        return this.difficulties.get(guildId).get(name);
    }

    addDifficulty(guildId, difficulty){
        this.difficulties.get(guildId).set(difficulty.name, difficulty);
        this.saveDifficulties(guildId);
    }

    async submitNohit(guildId, nohit){
        this.nohits.get(guildId).set(nohit.ID, nohit);
        this.saveNohits(guildId);
    }

    async getNohit(guildId, id) {
        const numericId = Number(id);
        return this.nohits.get(guildId).get(numericId);
    }

    async getNohitByData(guildId, userId, difficulty, boss){
        let match;
        for (const nohit of this.nohits.get(guildId).values()) {
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

    async getJourney(guildId, id) {
        const numericId = Number(id);
        return this.journeys.get(guildId).get(numericId);
    }

    async getJourneyByData(guildId, userId, difficulty){
        for (const journey of this.journeys.get(guildId).values()) {
            const sameUser = String(journey.UserID) === String(userId);
            const sameDifficulty = journey.Difficulty === difficulty;
            if (sameUser && sameDifficulty) {
                return journey;
            }
        }
        return undefined;
    }

    getTotal(guildId){
        return this.nohits.get(guildId).size;
    }

    async saveNohits(guildId){
        const items = Array.from(this.nohits.get(guildId).values());
        fs.writeFileSync(this.nohitPath(guildId), JSON.stringify(items, null, 2));
    }

    async saveJourneys(guildId){
        const items = Array.from(this.journeys.get(guildId).values())
        fs.writeFileSync(this.journeyPath(guildId), JSON.stringify(items, null, 2));
    }

    async saveAliases(guildId){
        const items = Array.from(this.aliases.get(guildId).entries()).map(([alias, boss]) => ({ alias, boss }));
        fs.writeFileSync(this.aliasPath(guildId), JSON.stringify(items, null, 2));
    }

    async saveDifficulties(guildId){
        const items = Array.from(this.difficulties.get(guildId).values());
        fs.writeFileSync(this.difficultyPath(guildId), JSON.stringify(items, null, 2));
    }

}
module.exports = JsonNohitDataAccess;
