const fs = require("fs");
const path = require("path");
const { Nohit } = require("../objects/Nohit");

class JsonNohitDataAccess {

    constructor(jsonPath = path.join(__dirname, "../Backup/NohitsData.json")) {
        this.jsonPath = jsonPath;
        this.nohits = this.importData();
    }

    importData() {
        if (fs.existsSync(this.jsonPath)) {
            const rawJson = fs.readFileSync(this.jsonPath, "utf-8");
            const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
            const nohitMap = new Map();
            for (const item of parsedJson) {
                nohitMap.set(item.ID, Object.assign(new Nohit(), item));
            }
            return nohitMap;
        }
        return new Map();
    }

    async getNohit(id) {
        const numericId = Number(id);
        return this.nohits.get(numericId);
    }

}
module.exports = JsonNohitDataAccess;
