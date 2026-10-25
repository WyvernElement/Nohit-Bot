class Difficulty{

    name;
    isModifier;
    bosses;

    constructor(name, abbreviation, isModifier){
        this.name = name;
        this.isModifier = isModifier;
        this.abbreviation = abbreviation;
        this.bosses = [];
        this.allowedModifiers = [];
    }
    
    addBoss(boss){
        if(!this.isModifier){
            this.bosses.push(boss);
            return true;
        }
        return false;
    }

    hasBoss(boss){
        return this.bosses.includes(boss);
    }

    addModifier(modifier){
        if(this.isModifier){
            this.allowedModifiers.push(modifier);
            return true;
        }
        return false;
    }

}
module.exports = {Difficulty}