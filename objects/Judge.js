class Judge{
    JudgeID;
    DefaultAlias;
    Aliases;
    Quote;
    Emoji = ":tada:";
    Next;
    Prev = [];

    constructor(id, alias, aliases, quote){
        this.JudgeID = id;
        this.DefaultAlias = alias;
        this.Aliases = aliases;
        this.Quote = quote;
    }
}
module.exports = {Judge}