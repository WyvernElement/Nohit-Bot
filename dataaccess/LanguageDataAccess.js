const fs = require("fs");
const path = require("path");

class LanguageDataAccess{

    constructor(
        langPath = path.join(__dirname, "../Languages")
    ){
        this.langPath = langPath;
        this.languages = this.importLanguages();
    }

    importLanguages() {
        const langsMap = new Map();
        if (fs.existsSync(this.langPath)) {
            for (const dir of fs.readdirSync(this.langPath)){
                const rawJson = fs.readFileSync(path.join(this.langPath, dir), "utf-8")
                const parsedJson = JSON.parse(rawJson.replace(/(:\s*)(\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
                langsMap.set(path.parse(path.join(this.langPath, dir)).name, parsedJson);
            }
        }
        return langsMap;
    }

    getResponse(language, key, iteration){
        if (iteration === 0){
            iteration = "";
        }
        console.log(this.languages.get(language));
        return this.languages.get(language)[String(key) + String(iteration)];
    }
}
const langs = new LanguageDataAccess();
module.exports = langs;
module.exports.LanguageDataAccess = LanguageDataAccess;