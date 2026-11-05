class Nohit{
    ID;
    UserID;
    Boss;
    Difficulty;
    Url;
    UserComment;
    Timestamp;
    Verification;
    JudgeComment;
    JudgeID;

    constructor(id, userId, difficulty, boss, url, comment){
        this.ID = id;
        this.UserID = userId;
        this.Difficulty = difficulty;
        this.Boss = boss;
        this.setURL(url);
        this.UserComment = comment;
        const now = new Date();
        this.Timestamp = now.toISOString();
        this.Verification = "Pending";
        this.JudgeComment = "Pending";
        this.JudgeID = 0;
    }

    setURL(url){
        if(url != undefined){
            const cleanedLink = url.split("?si=")[0].split("&si=")[0];  // removes stupid tracker from links automatically
            this.Url = cleanedLink;
        }
    }
}
module.exports = {Nohit}