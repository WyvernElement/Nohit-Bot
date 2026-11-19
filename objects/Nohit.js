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
    PreviousReviews = [];
    get Special(){
        return ["Boss Rush"].includes(this.Boss);
    }

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

    review(verification, judgeId, comment, messageId){
        this.PreviousReviews.unshift([this.Verification, this.JudgeID, this.JudgeComment, messageId]);
        this.Verification = verification;
        this.JudgeID = judgeId;
        this.JudgeComment = comment;
    }

    undo(judgeId){
        let previousState = ["", 0, "", 0];
        let reviewsOverturned = [];
        do {
            previousState = this.PreviousReviews.shift();
            reviewsOverturned.push(previousState[3]);
        } while (this.PreviousReviews.length > 0 && judgeId != previousState[1]);
        this.Verification = previousState[0];
        this.JudgeID = previousState[1];
        this.JudgeComment = previousState[2];
        return reviewsOverturned;
    }
}
module.exports = {Nohit}