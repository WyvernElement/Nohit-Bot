const fs = require("fs");
const path = require("path");
const { User } = require("../objects/User");
const { Judge } = require("../objects/Judge");

class JsonUserDataAccess{

    constructor(
        dataFolderPath = path.join(__dirname, "../Data"),
        userJsonPath = "/Backup/UserData.json",
        judgeJsonPath = "/Backup/JudgesData.json"
    ){
        this.dataFolderPath = dataFolderPath;
        this.userJsonPath = userJsonPath;
        this.judgeJsonPath = judgeJsonPath;
        this.users = this.importUsers();
        this.judges = this.importJudges();
    }

    getSubfolders(){
        return fs.readdirSync(this.dataFolderPath, {withFileTypes: true})
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name);
    }

    userPath(id){
        return path.join(this.dataFolderPath, id, this.userJsonPath)
    }

    judgePath(id){
        return path.join(this.dataFolderPath, id, this.judgeJsonPath)
    }
    
    importUsers() {
        const usersMap = new Map();
        for(const id of this.getSubfolders()){
            if (fs.existsSync(this.userPath(id))) {
                const rawJson = fs.readFileSync(this.userPath(id), "utf-8");
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const userMap = new Map();
                for (const item of parsedJson) {
                    userMap.set(item.ID, Object.assign(new User(), item));
                }
                usersMap.set(id, userMap);
            }
            else{
                usersMap.set(id, new Map())
            }
        }
        return usersMap;
    }

    importJudges() {
        const judgesMap = new Map();
        for (const id of this.getSubfolders()){
            if (fs.existsSync(this.judgePath(id))) {
                const rawJson = fs.readFileSync(this.judgePath(id), "utf-8")
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                const judgeMap = new Map();
                for (const item of parsedJson) {
                    judgeMap.set(item.JudgeID, Object.assign(new Judge(), item));
                }
                judgesMap.set(id, judgeMap);
            }
            else{
                judgesMap.set(id, new Map())
            }
        }
        return judgesMap;
    }

    getUser(guildId, id){
        if (!this.users.get(guildId).has(id)) {
            this.users.get(guildId).set(id, new User(id));
        }
        return this.users.get(guildId).get(id);
    }

    getJudge(guildId, id){
        return this.judges.get(guildId).get(id);
    }

    async saveUsers(guildId){
        const items = Array.from(this.users.get(guildId).values());
        fs.writeFileSync(this.userPath(guildId), JSON.stringify(items, null, 2));
    }

    async saveJudges(guildId){
        const items = Array.from(this.judges.get(guildId).values());
        fs.writeFileSync(this.judgePath(guildId), JSON.stringify(items, null, 2));
    }

    async updateUser(guildId, id, user){
        this.users.get(guildId).set(id, user);
    }

    async addJudge(guildId, id, alias, extraaliases, quote){
        const judge = new Judge(id, alias, extraaliases, quote)
        this.judges.set(id, judge);
        this.saveJudges(guildId);
    }




}
module.exports = JsonUserDataAccess;