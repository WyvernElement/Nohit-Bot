const NohitService = require("../service/NohitService.js");

function parseForKeywords(guild, args){
    let ID;
    let num;
    for (let i = 0; i < args.length; i++){
        if (Number.isFinite(Number(args[i]))){
            const val = args.splice(i--, 1)[0];
            if (!ID){
                if(NohitService.userData.users.get(guild).has(val)){
                    ID = ID ?? val;
                    continue;
                }
            }
            num = num ?? val;
        }
    }

    let diffList = [];
    for (let j = 0; j < args.length; j++){
        let check = args[j];
        for (let k = j + 1; k <= args.length; k++){
            const d = NohitService.resolveDifficulty(guild, check);
            if (d){
                diffList.push({ d: d.standard, b: d.base, s: j, e: k });
            }
            check += "-" + args[k];
        }
    }
    let compare = { length: 0, item: undefined};
    for (const diff of diffList){
        const len = diff.d.split("-").length;
        if (len > compare.length){
            compare.length = len;
            compare.item = diff;
        }
    }
    let difObj;
    let dif;
    if (compare.item){
        args.splice(compare.item.s, compare.item.e - compare.item.s);
        difObj = compare.item.b;
        dif = compare.item.d;
    }
    
    let name = "";
    let boss;
    for (let l = 0; l < args.length; l++){
        name += args[l];
        const b = NohitService.resolveBoss(guild, difObj, name);
        if (b){
            boss = { b: b, e: l };
        }
    }
    if (boss){
        args.splice(0, ++boss.e);
        boss = boss.b;
    }

    return { ID, num, Diff: dif, DiffObj: difObj, Boss: boss};
}
module.exports = { parseForKeywords }