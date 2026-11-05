const fs = require("fs");
const path = require("path");
const { User } = require("../objects/User");

class JsonUserDataAccess{

    constructor(
        dataFolderPath = path.join(__dirname, "../Data"),
        userJsonPath = "/Backup/UserData.json"
    ){
        this.dataFolderPath = dataFolderPath;
        this.userJsonPath = userJsonPath;
        this.users = this.importUsers();
    }

    getSubfolders(){
        return fs.readdirSync(this.dataFolderPath, {withFileTypes: true})
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name);
    }

    userPath(id){
        return path.join(this.dataFolderPath, id, this.userJsonPath)
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

    getUser(id){
        if (!this.users.has(id)) {
            this.users.set(id, new User(id));
        }
        return this.users.get(id);
    }

    async saveUsers(){
            fs.writeFileSync(this.userJsonPath, JSON.stringify(this.users, null, 2));
    }

    async updateUser(id, user){
        this.users.set(id, user);
    }




}
module.exports = JsonUserDataAccess;