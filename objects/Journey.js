class Journey{
    ID;
    UserID;
    Difficulty;
    NohitIDs;
    SpecialIDs;
    Playlist;
    V;
    DQ;
    Pending;
    Completed;
    Comment;

    constructor(id, userid, difficulty){
        this.ID = id;
        this.UserID = userid;
        this.Difficulty = difficulty;
        this.NohitIDs = [];
        this.SpecialIDs = [];
        this.V = 0;
        this.DQ = 0;
        this.Pending = 0;
        this.Completed = false;
        this.Comment = "";
    }

    addNohit(id, special){
        if (special){
            if (!this.SpecialIDs.includes(id)){
                this.SpecialIDs.push(id);
            }
        }
        else if (!this.NohitIDs.includes(id)){
            this.NohitIDs.push(id);
        }
    }

    setPlaylist(link){
        const cleanedLink = link.split("?si=")[0].split("&si=")[0];  // removes stupid tracker from links automatically
        this.Playlist = cleanedLink;
    }

    getTotal(){
        return this.NohitIDs.length;
    }
}
module.exports = {Journey}
