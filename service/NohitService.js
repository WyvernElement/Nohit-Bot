const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");
const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const { Nohit } = require("../objects/Nohit");
const { Difficulty } = require("../objects/Difficulty");
const { Boss } = require("../objects/Boss");
const {Journey} = require("../objects/Journey");

const DiscordService = require("../service/DiscordService.js");
const ModerationService = require("../service/ModerationService");

class NohitService {

    constructor(
        nohitData = new JsonNohitDataAccess(),
        userData = new JsonUserDataAccess()
    ) {
        this.nohitData = nohitData;
        this.userData = userData;
        for (const [guild, journeys] of nohitData.journeys){
            this.addJourneyAssociation(guild);
        }
    }

    async addJourneyAssociation(guildId){
        for (const [id, journey] of this.nohitData.journeys.get(guildId)){
            const user = await this.userData.getUser(guildId, journey.UserID);
            await user.addJourney(journey.Difficulty, id);
        }
    }
    
    async lookup(guildId, id){
        const nohit = await this.nohitData.getNohit(guildId, id);
        return nohit;
    }

    async lookupByBoss(guildId, userId, difficulty, boss){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const resolvedBoss = resolved ? this.resolveBoss(guildId, resolved.base, this.nohitData.getBoss(guildId, boss) ?? boss) : undefined;
        const bossName = resolvedBoss?.textName ?? boss;
        const nohit = await this.nohitData.getNohitByData(guildId, userId, difficultyName, bossName);
        return nohit;
    }

    async lookupReview(guildId, id){
       return await this.nohitData.getReview(guildId, id);
    }

    async addReview(guildId, id, messageId, bias){
        await this.nohitData.addReview(guildId, id, messageId, bias);
        const config = await ModerationService.getConfig(guildId);
        DiscordService.editMessageInChannel(config.nohitQueueChannel, config.rrQueueMessage, await this.getReviewsComment(guildId));
        const reviewChannel = config.reviewChannels.get(bias);
        DiscordService.editMessageInChannel(reviewChannel.ID, reviewChannel.RR, await this.getReviewsComment(guildId, bias));
    }

    async removeReview(guildId, id){
        const bias = (await this.nohitData.getReview(guildId, id))?.Bias;
        if (bias){
            await this.nohitData.removeReview(guildId, id);
            const config = await ModerationService.getConfig(guildId);
            DiscordService.editMessageInChannel(config.nohitQueueChannel, config.rrQueueMessage, await this.getReviewsComment(guildId));
            const reviewChannel = config.reviewChannels.get(bias);
            DiscordService.editMessageInChannel(reviewChannel.ID, reviewChannel.RR, await this.getReviewsComment(guildId, bias));
        }
    }

    async getReviewsComment(guildId, bias){
        const ids = await this.nohitData.getAllReviews(guildId, bias);
        let message = `** **\n\n\n⋆.˚ —★ ─⟢───⟢───⟢───⟢───⟢───⟢───⟢───⟢───⟢─ ★— ˚.⋆
\n\t\t✰ **__Nohits currently pending a requested review:__** ✰`;
        if (ids.length === 0){
            message += "\n~✦~ None! ;3c"
        }
        else{
            for (const id of ids){
                const nohit = await this.lookup(guildId, id);
                message += `\n\t\t~✦~     **[${id}] ${nohit.Boss}** on **${nohit.Difficulty}** by <@${nohit.UserID}>`
            }
        }
        message += `\n\n⋆.˚ —★ ─⟢───⟢───⟢───⟢───⟢───⟢───⟢───⟢───⟢─ ★— ˚.⋆`
        return message;
    }

    async catalogue(guildId, difficulty, boss, count, verified){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const resolvedBoss = resolved ? this.resolveBoss(guildId, resolved.base, boss) : undefined;
        const bossName = resolvedBoss?.textName ?? this.nohitData.getBoss(guildId, boss) ?? boss;
        const nohitCatalogue = await this.nohitData.catalogue(guildId, difficultyName, bossName, count, verified);
        return nohitCatalogue;
    }

    async lookupJourney(guildId, id){
        const journey = await this.nohitData.getJourney(guildId, id);
        return journey;
    }

    async lookupByUser(guildId, userId, difficulty){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        const difficultyName = resolved ? resolved.standard : difficulty;
        const journey = await this.nohitData.getJourneyByData(guildId, userId, difficultyName);
        return journey;
    }

    async journeyComment(guildId, journey, comment){
        journey.Comment = comment.slice(0, 1024);
        await this.nohitData.updateJourney(guildId, journey);
    }

    async submit(guildId, userId, difficulty, boss, url, comment){
        const resolved = this.resolveDifficulty(guildId, difficulty);
        if (!resolved) {
            return undefined; //mmm I should change this to be something specific for the text
        }
        const resolvedBoss = this.resolveBoss(guildId, resolved.base, boss);
        if (!resolvedBoss) {
            return undefined; //this one too
        }
        const existingNohit = await this.lookupByBoss(guildId, userId, difficulty, boss);
        const id = existingNohit ? existingNohit.ID : (await this.totalNohits(guildId)) + 1;
        const newNohit = new Nohit(id, userId, resolved.standard, resolvedBoss.textName, url, comment);
        const user = await this.userData.getUser(guildId, userId);
        let journey = await this.nohitData.getJourneyByData(guildId, userId, resolved.standard);
        if(!journey){
            journey = new Journey((await this.nohitData.totalJourneys(guildId)) + 1, userId, resolved.standard);
        }
        journey.addNohit(id, resolvedBoss.special);
        await this.nohitData.submitNohit(guildId, newNohit);
        await this.nohitData.updateJourney(guildId, journey);
        await this.userData.updateUser(guildId, userId, user);
        return newNohit;
    }

    async deleteNohit(guildId, nohit){
        await this.nohitData.deleteNohit(guildId, nohit);
        this.updateJourneys(guildId);
    }

    async recomment(guildId, id, newComment){
        const nohit = await this.nohitData.getNohit(guildId, id);
        nohit.UserComment = newComment.slice(0, 1024);
        await this.nohitData.submitNohit(guildId, nohit);
    }

    async updateJourneys(guildId){
        const journeys = [];
        for (const [id, journey] of this.nohitData.journeys.get(guildId)){
            journey.V = 0;
            journey.DQ = 0;
            journey.Pending = 0;
            for (const id of journey.NohitIDs){
                const nohit = await this.lookup(guildId, id);
                if (nohit.UserComment === "Deleted"){
                    journey.NohitIDs.splice(journey.NohitIDs.indexOf(id), 1);
                    continue;
                }
                switch (nohit.Verification){
                case "Verified":
                    journey.V++;
                    break;
                case "Disqualified":
                    journey.DQ++;
                    break;
                case "Pending":
                    journey.Pending++;
                    break;
                }
            }
            const resolved = this.resolveDifficulty(guildId, journey.Difficulty);
            const difficulty = resolved ? resolved.base : this.findDifficulty(guildId, journey.Difficulty);
            if (difficulty && journey.NohitIDs.length >= difficulty.bosses.length){
                journey.Completed = true;
                if (journey.V >= difficulty.bosses.length){
                    journey.Finished = true;
                }
            }
            journeys.push(journey);
        }
        await this.nohitData.updateJourneys(guildId, journeys);
    }

    async lookupCompletedJourney(guildId, id, nohit){
        return await this.nohitData.lookupCompletedJourney(guildId, id, nohit);
    }

    async addCompletedJourney(guildId, id, bias, nohit){
        this.nohitData.addCompletedJourney(guildId, id, bias, nohit);
        this.updatePinnedQueueMessages(guildId, bias);
    }

    async removeCompletedJourney(guildId, id, bias, nohit){
        this.nohitData.removeCompletedJourney(guildId, id, nohit);
        this.updatePinnedQueueMessages(guildId, bias);
    }

    async ignoreJourney(guildId, id, nohit){
        const completed = await this.lookupCompletedJourney(guildId, id, nohit);
        if (completed){
            completed.Ignored = !completed.Ignored;
            await this.nohitData.updateCompletedJourney(guildId, completed);
            this.updatePinnedQueueMessages(guildId, completed.Bias);
        }
        return completed;
    }

    async updatePinnedQueueMessages(guildId, bias){
        const config = await ModerationService.getConfig(guildId);
        await this.updateJourneys(guildId);
        DiscordService.editMessageInChannel(config.nohitQueueChannel, config.journeyQueueMessage, await this.getQueueComment(guildId));
        const reviewChannel = config.reviewChannels.get(bias);
        DiscordService.editMessageInChannel(reviewChannel.ID, reviewChannel.Queue, await this.getQueueComment(guildId, bias));
    }

    async getQueueComment(guildId, bias){
        let message = `**┌──────── ⋆⋅☆⋆♡⋆☆⋅⋆ ────────┐**
    ♡**__Finished nohit journeys that currently need judging__**♡`
        let count = 0;
        for (const obj of await this.getViableCompletedJourneys(guildId, bias, true, true)){
            count++;
            const journey = await this.lookupJourney(guildId, obj.ID);
            message += `\n${count}. **[${journey.ID}]** - <@${journey.UserID}> (${journey.Difficulty})`;
        }
        if (count === 0){
            message += `\n\t֎ None! :3 ֎`;
        }
        message += `\n**└──────── ⋆⋅☆⋆♡⋆☆⋅⋆ ────────┘**

•⋅⋅•⋅⊰⋅⋅•⋅⋅•⋅⊰⋅•⋅⋅•∙∘☽༓☾∘∙•⋅⋅•⋅⊰⋅•⋅⋅•⋅⋅⊰⋅•⋅⋅•
    ❅**__Finished miscellaneous nohit journeys__ **❅`
        count = 0;
        for (const obj of await this.getViableCompletedJourneys(guildId, bias, true, false)){
            count++;
            if (obj.Nohit){
                const nohit = await this.lookup(guildId, obj.ID);
                message += `\n${count}. **[${nohit.ID}]** - <@${nohit.UserID}> ${nohit.Boss} (${nohit.Difficulty})`;
            }
            else{
                const journey = await this.lookupJourney(guildId, obj.ID);
                message += `\n${count}. **[${journey.ID}]** - <@${journey.UserID}> (${journey.Difficulty})`;
            }
        }
        if (count === 0){
            message += `\n\t֎ None! :3 ֎`;
        }
        message += `\n•⋅⋅•⋅⊰⋅⋅•⋅⋅•⋅⊰⋅•⋅⋅•∙∘☽༓☾∘∙•⋅⋅•⋅⊰⋅•⋅⋅•⋅⋅⊰⋅•⋅⋅•

✿•∘ɷ∘•✿••✿•∘ɷ∘•✿•✿•∘ɷ∘•✿••✿•∘ɷ∘•✿
    ✰**__Completed journeys with DQs__**✰`
        count = 0;
        for (const obj of await this.getViableCompletedJourneys(guildId, bias, false)){
            count++;
            const journey = await this.lookupJourney(guildId, obj.ID);
            message += `\n${count}. **[${journey.ID}]** - <@${journey.UserID}> (${journey.Difficulty} | ${journey.DQ})`;
        }
        if (count === 0){
            message += `\n\t֎ None! :3 ֎`;
        }
        message += `\n✿•∘ɷ∘•✿••✿•∘ɷ∘•✿•✿•∘ɷ∘•✿••✿•∘ɷ∘•✿`
        return message;
    }

    async checkJourneyCompletion(guildId, id, nohit){
        return await this.nohitData.checkJourneyCompletion(guildId, id, nohit);
    }

    async completedJourneysList(guildId){
        return await this.nohitData.completedJourneysList(guildId);
    }

    async getViableCompletedJourneys(guildId, bias, filterDQs, filterMisc){
        let list = await this.nohitData.completedJourneysList(guildId);
        let map = [];
        for (const obj of list){
            if (obj.Ignored){
                map.push(false);
                continue;
            }
            if (obj.Nohit){
                const nohit = await this.lookup(guildId, obj.ID);
                if (filterMisc || !filterDQs){
                    map.push(false);
                    continue;
                }
                map.push(true);
                continue;
            }
            const journey = await this.lookupJourney(guildId, obj.ID);
            if (bias && obj.Bias != bias){
                map.push(false);
                continue;
            }
            if (filterMisc != undefined){
                const diff = this.resolveDifficulty(guildId, journey.Difficulty).base;
                if (diff.special === filterMisc){
                    map.push(false);
                    continue;
                }
            }
            if (filterDQs){
                map.push(journey.DQ === 0 && journey.Pending > 0);
            }
            else{
                map.push(journey.DQ != 0);
            }
        }
        return list.filter((e, i) => map[i]);
    }

    async stats(guildId){
        await this.updateJourneys(guildId);
        
        let Stats = {
            V: 0,
            DQ: 0,
            P: 0,
            D: 0,
            T: 0
        };
        const Bosses = new Map();
        const Diffs = new Map();
        for (const nohit of this.nohitData.nohits.get(guildId).values()){
            if (!Bosses.has(nohit.Boss)){
                Bosses.set(nohit.Boss,{
                    V: 0,
                    DQ: 0,
                    P: 0,
                    D: 0,
                    T: 0
                });
            }
            const boss = Bosses.get(nohit.Boss);
            if (!Diffs.has(nohit.Difficulty)){
                Diffs.set(nohit.Difficulty,{
                    V: 0,
                    DQ: 0,
                    P: 0,
                    D: 0,
                    T: 0
                });
            }
            const diff = Diffs.get(nohit.Difficulty);

            switch (nohit.Verification){
                case "Verified":
                    Stats.V++;
                    boss.V++;
                    diff.V++;
                    break;
                case "Disqualified":
                    Stats.DQ++;
                    boss.DQ++;
                    diff.DQ++;
                    break;
                case "Pending":
                    Stats.P++;
                    boss.P++;
                    diff.P++;
                    break;
            }
            
            if (nohit.UserComment === "Deleted"){
                Stats.D++;
            }
            else{
                boss.T++;
                diff.T++;
            }
            Stats.T++;
        }
        return { Stats, Bosses, Diffs }
    }

    async totalNohits(guildId){
        return this.nohitData.getTotal(guildId);
    }

    resolveBoss(guildId, difficulty, token){
        if (!difficulty || typeof token !== "string") {
            return undefined;
        }
        const aliased = this.nohitData.getBoss(guildId, token);
        const names = aliased ? [token, aliased] : [token];
        let returnBoss = difficulty.bosses?.find(boss => names.includes(boss.name) || names.includes(boss.textName));
        if (!returnBoss){
            returnBoss = difficulty.specialBosses?.find(boss => names.includes(boss.name) || names.includes(boss.textName));
        }
        return returnBoss;
    }

    resolveDifficulty(guildId, difficultyText){
        if (typeof difficultyText !== "string" || difficultyText.trim() === "") {
            return undefined;
        }
        const parts = difficultyText.split("-").map(part => part.trim()).filter(Boolean);
        if (parts.length === 0) {
            return undefined;
        }
        const difficulties = parts.map(part => this.findDifficulty(guildId, part, true));
        if (difficulties.some(difficulty => difficulty === undefined)) {
            return undefined;
        }
        let mix = difficulties.filter(parsed => parsed.modifier);
        let bases = difficulties.filter(difficulty => !difficulty.isModifier && !difficulty.diff && !difficulty.modifier);
        let modifiers = difficulties.filter(difficulty => difficulty.isModifier);
        if (mix.length > 0){
            if (bases.length === 0){
                bases = [mix.shift().diff, ...bases];
                modifiers = [...mix.flatMap(parsed => parsed.modifier), ...modifiers];
            }
            else{
                modifiers = [...mix.flatMap(parsed => parsed.modifier), ...modifiers];
            }
            if (modifiers.some(mod => modifiers.indexOf(mod) != modifiers.lastIndexOf(mod))){
                return undefined;
            }
        }
        if (bases.length !== 1) {
            return undefined;
        }
        const base = bases[0];
        for (const modifier of modifiers) {
            if (!base.allowedModifiers.includes(modifier.name)) {
                return undefined;
            }
        }
        const orderedModifiers = base.allowedModifiers.filter(name =>
            modifiers.some(modifier => modifier.name === name)
        );
        const standard = [...orderedModifiers, base.name].join("-");
        return { base, standard };
    }

    findDifficulty(guildId, token, mod){
        const direct = this.nohitData.getDifficulty(guildId, token);
        if (direct) {
            return direct;
        }
        let modifier;
        let diff;
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === token.toLowerCase()) {
                if (mod){
                    if (difficulty.isModifier){
                        modifier = difficulty;
                    }
                    else{
                        diff = difficulty;
                    }
                }
                else{
                    return difficulty
                }
            }
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.name.toLowerCase().includes(token.toLowerCase())) {
                if (mod){
                    if(!diff){
                        diff = difficulty;
                    }
                    if(!modifier){
                        modifier = difficulty;
                    }
                }
                else{
                    return difficulty;
                }
            }
        }
        if (mod){
            if (!modifier || modifier === diff){
                return diff;
            }
            if (!diff){
                return modifier;
            }
            return { diff, modifier };
        }
        return undefined;
    }

    checkJudge(guildId, id){
        return this.userData.getJudge(guildId, id) ?? false;
    }

    createDifficulty(guildId, name, abbreviation, isModifier, bias){
        if (typeof name !== "string" || name.trim() === "") {
            return undefined;
        }
        if (typeof abbreviation !== "string" || abbreviation.trim() === "") {
            return undefined;
        }
        const trimmedName = name.trim();
        const trimmedAbbrev = abbreviation.trim().toLowerCase();
        if (this.nohitData.getDifficulty(guildId, trimmedName)) {
            return { conflict: "name" };
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === trimmedAbbrev) {
                return { conflict: "abbreviation" };
            }
        }
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, Boolean(isModifier), bias);
        this.nohitData.addDifficulty(guildId, difficulty);
        return difficulty;
    }

    copyDifficulty(guildId, name, abbreviation, otherDifficulty, bias){
        if (typeof name !== "string" || name.trim() === ""){
            return undefined;
        }
        if(typeof abbreviation !== "string" || abbreviation.trim() === ""){
            return undefined;
        }
        const trimmedName = name.trim();
        const trimmedAbbrev = abbreviation.trim().toLowerCase();
        if (this.nohitData.getDifficulty(guildId, trimmedName)) {
            return { conflict: "name" };
        }
        for (const difficulty of this.nohitData.difficulties.get(guildId).values()) {
            if (difficulty.abbreviation === trimmedAbbrev) {
                return { conflict: "abbreviation" };
            }
        }
        const otherDiff = this.findDifficulty(guildId, otherDifficulty);
        const difficulty = new Difficulty(trimmedName, trimmedAbbrev, false, bias);
        difficulty.copyAdd(otherDiff);
        this.nohitData.addDifficulty(guildId, difficulty);
        return difficulty;
    }

    async addBoss(guildId, difficultyToken, bossName, order, textName){
        if (typeof bossName !== "string" || bossName.trim() === "") {
            return undefined;
        }
        if (typeof textName !== "string" || textName.trim() === "") {
            return undefined;
        }
        const progressionOrder = Number(order);
        if (!Number.isFinite(progressionOrder)) {
            return undefined;
        }
        const difficulty = this.resolveDifficulty(guildId, difficultyToken).base;
        if (!difficulty || difficulty.isModifier) {
            return undefined;
        }
        const trimmedBossName = bossName.trim().toLowerCase();
        if (difficulty.hasBoss(trimmedBossName)) {
            return { duplicate: true };
        }
        const boss = new Boss(trimmedBossName, progressionOrder, textName.trim());
        difficulty.addBoss(boss);
        this.nohitData.addDifficulty(guildId, difficulty);
        return difficulty;
    }

    async addModifiers(guildId, difficulty, modifiers){
        const result = [];
        for(const modifier of modifiers){
            if(!modifier || difficulty.allowedModifiers.includes(modifier.name) || !modifier.isModifier){
                result.push(false)
            }
            else{
                result.push(difficulty.addModifier(modifier.name));
            }
        }
        this.nohitData.addDifficulty(guildId, difficulty);
        return result;
    }

    async addAliases(guildId, bossName, aliases){
        const duplicate = [];
        for (const alias of aliases){
            if (this.nohitData.getBoss(guildId, alias) === bossName){
                duplicate.push(alias);
            }
            else {
                this.nohitData.addAlias(guildId, alias, bossName);
            }
        }
        return duplicate;
    }

    async toggleSubmissions(guildId, difficulty){

        const resolved = this.resolveDifficulty(guildId, difficulty);
        if(!resolved){
            return null;
        }
        else{
            const base = resolved.base;
            base.isSubmittable = !base.isSubmittable;
            this.nohitData.addDifficulty(guildId, base);
            return base.isSubmittable;
        }
    }

    async judgeRecommentID(guildId, id, newComment, judgeId){
        const nohit = await this.lookup(guildId, id);
        return await this.judgeRecommentHelper(guildId, nohit, newComment, judgeId);
    }
    async judgeRecomment(guildId, userId, difficulty, boss, newComment, judgeId){
        const nohit = await this.lookupByBoss(guildId, userId, difficulty, boss)
        return await this.judgeRecommentHelper(guildId, nohit, newComment, judgeId);
    }

    async judgeRecommentHelper(guildId, nohit, newComment, judgeId){
        if(!nohit){
            return null;
        }
        if(nohit.Verification === "Pending"){
            return "Pending";
        }
        if(judgeId !== nohit.JudgeID){
            return "Not Allowed";
        }
        nohit.JudgeComment = newComment;
        await this.nohitData.submitNohit(guildId, nohit);
        return {userId: nohit.UserID,
        id: nohit.ID};
    }

}
const service = new NohitService();
module.exports = service;
module.exports.NohitService = NohitService;
