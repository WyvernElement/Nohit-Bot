class Boss{
    name; //no spaces
    textName; //has spaces
    progressionOrder;

    constructor(nameID, progressionOrder, canonicalName){
        this.name = nameID;
        this.textName = canonicalName;
        this.progressionOrder = progressionOrder;
    }

    reOrder(newOrder){
        this.progressionOrder = newOrder;
    }
}

module.exports = {Boss}