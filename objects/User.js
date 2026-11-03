class User{
    ID;
    OwnedNohits = new Map();
    Playlists = new Map();
    Language;

    constructor(id){
        this.ID = id
    }
    
    async addJourney(difficulty, id){
        this.OwnedNohits.set(difficulty, id);
    }

    async addPlaylist(difficulty, link){
        this.Playlists.set(difficulty, link);
    }
}
module.exports = {User};
