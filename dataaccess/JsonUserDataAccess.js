const fs = require("fs");
const path = require("path");
const { User } = require("../objects/User");

class JsonUserDataAccess{

    constructor(
        userJsonPath = path.join(__dirname, "../Backup.UserData.json")
    ){
        this.userJsonPath = userJsonPath;
        this.users = this.importUsers();
    }
    
    importUsers() {
        if (fs.existsSync(this.userJsonPath)) {
            const rawJson = fs.readFileSync(this.userJsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const userMap = new Map();
            for (const item of parsedJson) {
                userMap.set(item.ID, Object.assign(new User(), item));
            }
            return userMap;
        }
        return new Map();
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