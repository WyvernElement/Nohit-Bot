class Boss{
    name; //no spaces
    textName; //has spaces
    progressionOrder;
    special;

    constructor(nameID, progressionOrder, canonicalName, special){
        this.name = nameID;
        this.textName = canonicalName;
        this.progressionOrder = progressionOrder;
        this.special = special ?? false;
    }

    reOrder(newOrder){
        this.progressionOrder = newOrder;
    }
}

module.exports = {Boss}