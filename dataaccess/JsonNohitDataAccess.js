const fs = require("fs");
const path = require("path");
const { Nohit } = require("../objects/Nohit");
const { Journey } = require ("../objects/Journey");
const { Difficulty } = require ("../objects/Difficulty");
const { Boss } = require("../objects/Boss");
class JsonNohitDataAccess {

    constructor(
        dataFolderPath = path.join(__dirname, "../Data"),
        nohitsJsonPath = "/Backup/NohitsData.json",
        journeysJsonPath = "/Backup/JourneysData.json",
        difficultiesJsonPath = "/Backup/DifficultiesData.json",
        aliasesJsonPath = "/Backup/AliasesData.json",
        rrJsonPath = "/Backup/NohitsToReview.json",
        completeJsonPath = "/Backup/CompleteJourneys.json"
    ) {
        this.dataFolderPath = dataFolderPath;
        this.nohitsJsonPath = nohitsJsonPath;
        this.journeysJsonPath = journeysJsonPath;
        this.difficultiesJsonPath = difficultiesJsonPath;
        this.aliasesJsonPath = aliasesJsonPath;
        this.rrJsonPath = rrJsonPath;
        this.completeJsonPath = completeJsonPath;
        this.nohits = this.importNohits();
        this.journeys = this.importJourneys();
        this.difficulties = this.importDifficulties();
        this.aliases = this.importMap(this.aliasPath, "alias", "boss");
        this.rrNohits = this.importMap(this.rrPath, "id", "message");
        this.completedJourneys = this.importArray(this.completePath);
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

    aliasPath(id, item){
        return path.join(item.dataFolderPath, id, item.aliasesJsonPath);
    }

    playlistPath(id){
        return path.join(this.dataFolderPath, id, "/Backup/PlaylistsData.json");
    }

    rrPath(id, item){
        return path.join(item.dataFolderPath, id, item.rrJsonPath);
    }

    completePath(id, item){
        return path.join(item.dataFolderPath, id, item.completeJsonPath);
    }



    importNohits() {
        const nohitsMap = new Map();
        for(const id of this.getSubfolders()){
            if (fs.existsSync(this.nohitPath(id))) {
                const rawJson = fs.readFileSync(this.nohitPath(id), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const nohitMap = new Map();
                for (const item of parsedJson){
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

    toBoss(boss){
        if (typeof boss === "string") {
            return new Boss(boss.replace(/ /g, ""), undefined, boss);
        }
        return new Boss(boss.name.toLowerCase(), boss.progressionOrder, boss.textName ?? boss.name);
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
                    difficulty.bosses = (item.bosses ?? []).map(boss => this.toBoss(boss));
                    difficultyMap.set(item.name, difficulty);
                }
                difficultiesMap.set(id, difficultyMap);
            }
            else{
                difficultiesMap.set(id, new Map());
            }
        }
        return difficultiesMap;
    }

    importMap(path, key, value, item){
        const sMap = new Map();
        for(const id of this.getSubfolders()){
            if(fs.existsSync(path(id, this))){
                const rawJson = fs.readFileSync(path(id, this), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const map = new Map();
                if ([...Object.values(parsedJson)].length > 0){
                    for (const item of parsedJson) {
                        map.set(item[key], item[value]);
                    }
                }
                sMap.set(id, map);
            }
            else{
                sMap.set(id, new Map());
            }
        }
        return sMap;
    }

    importArray(path){
        const map = new Map();
        for(const id of this.getSubfolders()){
            if(fs.existsSync(path(id, this))){
                const rawJson = fs.readFileSync(path(id, this), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const arr = [];
                for (const item of parsedJson) {
                    arr.push(item);
                }
                map.set(id, arr);
            }
            else{
                map.set(id, []);
            }
        }
        return map;
    }

    importIgnoredJourneys(guildId) {
        const igJpath = path.join(__dirname, "../Data", guildId, "/Backup/IgnoredJourneys.json");
        if (fs.existsSync(igJpath)) {
            const rawJson = fs.readFileSync(igJpath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const igJ = [];
            for (const item of parsedJson) {
                igJ.push(item);
            }
            return igJ;
        }
        return [];
    }

    async buildJourneysFromNohitBotv2(guildId){
        for (const [id, nohit] of this.nohits.get(guildId)){
            let journey = await this.getJourneyByData(guildId, nohit.UserID, nohit.Difficulty)
            if (journey === undefined) {
                journey = new Journey(this.journeys.get(guildId).size + 1, nohit.UserID, nohit.Difficulty);
            }
            journey.addNohit(nohit.ID, nohit.Special);
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

    async deleteNohit(guildId, nohit){
        nohit.UserID = 0;
        nohit.Boss = "Deleted";
        nohit.Difficulty = "Deleted";
        nohit.Url = "Deleted";
        nohit.UserComment = "Deleted";
        nohit.Verification = "Deleted";
        nohit.JudgeComment = "Deleted";
        nohit.JudgeID = 0;
        this.submitNohit(guildId, nohit);
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

    async getReview(guildId, id){
        const numericId = Number(id);
        return this.rrNohits.get(guildId).get(numericId);
    }

    async addReview(guildId, id, messageId, bias){
        this.rrNohits.get(guildId).set(id, { ID: messageId, Bias: bias });
        this.saveRRs(guildId);
    }

    async removeReview(guildId, id){
        this.rrNohits.get(guildId).delete(id);
        this.saveRRs(guildId);
    }

    async getAllReviews(guildId, bias){
        let reviews = [];
        for (const [id, rr] of this.rrNohits.get(guildId)){
            if (!bias || bias === rr.Bias){
                reviews.push(id);
            }
        }
        return reviews;
    }

    catalogue(guildId, difficulty, boss, count, verified){
        let nohitsFound = [];
        for(const nohit of this.nohits.get(guildId).values()){
            const sameDifficulty = nohit.Difficulty === difficulty;
            const sameBoss = nohit.Boss === boss;
            if(sameBoss && sameDifficulty){
                if(!verified || nohit.Verification === "Verified"){
                    nohitsFound.push(nohit);
                }
            }
        }
        nohitsFound.sort((a, b) => Date.parse(b.Timestamp) - Date.parse(a.Timestamp));
        return nohitsFound.slice(0, count);
    }

    async getJourney(guildId, id) {
        const numericId = Number(id);
        return this.journeys.get(guildId).get(numericId);
    }

    async totalJourneys(guildId){
        return this.journeys.get(guildId).size;
    }

    async updateJourney(guildId, newJourney){
        this.journeys.get(guildId).set(newJourney.ID, newJourney);
        this.saveJourneys(guildId);
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

    async lookupCompletedJourney(guildId, id){
        return this.completedJourneys.get(guildId).find((e) => e.ID === id);
    }

    async addCompletedJourney(guildId, id, bias){
        if (!this.completedJourneys.get(guildId).some((e) => e.ID === id && e.Bias === bias)){
            this.completedJourneys.get(guildId).push({ID: id, Bias: bias, Ignore: false});
            this.saveCompleteJourneys(guildId);
        }
    }

    async removeCompletedJourney(guildId, id){
        this.completedJourneys.set(guildId, this.completedJourneys.get(guildId).filter((e) => e.ID != id));
        this.saveCompleteJourneys(guildId);
    }

    async checkJourneyCompletion(guildId, id){
        return this.completedJourneys.get(guildId).filter((e) => e.ID === id).length > 0;
    }

    async completedJourneysList(guildId){
        return this.completedJourneys.get(guildId);
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
        fs.writeFileSync(this.aliasPath(guildId, this), JSON.stringify(items, null, 2));
    }

    async saveDifficulties(guildId){
        const items = Array.from(this.difficulties.get(guildId).values());
        fs.writeFileSync(this.difficultyPath(guildId), JSON.stringify(items, null, 2));
    }

    async saveRRs(guildId){
        const items = Array.from(this.rrNohits.get(guildId).entries()).map(([id, message]) => ({ id, message }));
        fs.writeFileSync(this.rrPath(guildId, this), JSON.stringify(items, null, 2));
    }
    
    async saveCompleteJourneys(guildId){
        const items = this.completedJourneys.get(guildId);
        fs.writeFileSync(this.completePath(guildId, this), JSON.stringify(items, null, 2));
    }

}
module.exports = JsonNohitDataAccess;
