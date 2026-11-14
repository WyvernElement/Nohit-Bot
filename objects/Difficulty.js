class Difficulty{

    name;
    isModifier;
    bosses;
    isSubmittable;

    constructor(name, abbreviation, isModifier){
        this.name = name;
        this.isModifier = isModifier;
        this.abbreviation = abbreviation;
        this.bosses = [];
        this.allowedModifiers = [];
    }
    
    copyAdd(other){
        if(!this.isModifier){
            for(const boss of other.bosses){
                if(!this.hasBoss(boss)){
                    this.addBoss(boss);
                }
            }
            for(const modifier of other.allowedModifiers){
                if(!this.allowsModifier(modifier)){
                    this.addModifier(modifier);
                }
            }
        }
    }
    
    addBoss(boss){
        if(!this.isModifier){
            this.bosses.push(boss);
            return true;
        }
        return false;
    }

    hasBoss(name){
        return this.bosses.some(boss => boss.name === name);
    }

    addModifier(modifier){
        if(!this.isModifier){
            this.allowedModifiers.push(modifier);
            return true;
        }
        return false;
    }

    allowsModifier(modifier){
        if(!thisisModifier){
            return this.allowedModifiers.includes(modifier);
        }
        return false;
    }

}
module.exports = {Difficulty}