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
        this.Url = url;
        this.UserComment = comment;
        const now = new Date();
        this.Timestamp = now.toISOString();
        this.Verification = "Pending";
        this.JudgeComment = "Pending";
        this.JudgeID = 0;
    }
}
module.exports = {Nohit}