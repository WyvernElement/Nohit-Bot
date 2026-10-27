class User{
    ID;
    OwnedNohits = new Map();
    Playlists = new Map();
    Language;

    constructor(id){
        this.ID = id
    }
    
    async addJourney(id, journey){
        this.OwnedNohits.set(id, journey);
    }

    async addPlaylist(link, difficulty){
        this.Playlists.set(difficulty, link);
    }
}
module.exports = {User};
