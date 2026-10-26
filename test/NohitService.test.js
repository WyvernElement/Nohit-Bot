const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const nohitService = require("../service/NohitService");
const { NohitService } = require("../service/NohitService");
const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");
const JsonUserDataAccess = require("../dataaccess/JsonUserDataAccess");
const { Difficulty } = require("../objects/Difficulty");

const backupPath = path.join(__dirname, "../Backup/NohitsData.json");

function createService() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nohit-service-"));
    const data = new JsonNohitDataAccess(
        path.join(dir, "NohitsData.json"),
        path.join(dir, "DifficultiesData.json"),
        path.join(dir, "AliasesData.json")
    );

    const death = new Difficulty("Death", "D", false);
    death.addBoss("King Slime");
    death.addBoss("Eye of Cthulhu");
    death.allowedModifiers.push("Shroomed", "Defiled");
    data.addDifficulty(death);

    const empyreal = new Difficulty("Empyreal", "E", false);
    empyreal.addBoss("Providence");
    data.addDifficulty(empyreal);

    data.addDifficulty(new Difficulty("Shroomed", "S", true));
    data.addDifficulty(new Difficulty("Defiled", "Def", true));
    data.addAlias("ks", "King Slime");

    const userData = new JsonUserDataAccess(path.join(dir, "UserData.json"));

    return {
        dir,
        data,
        userData,
        service: new NohitService(data, userData)
    };
}

test("module exports a constructed NohitService instance", () => {
    assert.equal(typeof nohitService.lookup, "function");
    assert.equal(typeof nohitService.lookupByBoss, "function");
    assert.equal(typeof nohitService.submit, "function");
    assert.equal(typeof nohitService.recomment, "function");
    assert.equal(typeof nohitService.totalNohits, "function");
    assert.ok(nohitService.nohitData instanceof JsonNohitDataAccess);
});

test("lookup returns nohit from json", async () => {
    assert.ok(fs.existsSync(backupPath));

    const result = await nohitService.lookup(1);

    assert.ok(result);
    assert.equal(result.ID, 1);
    assert.equal(result.Boss, "King Slime");
    assert.equal(result.Url, "https://youtu.be/w3CKgPUb96A");
});

test("lookup returns undefined when ID is not found", async () => {
    const result = await nohitService.lookup(Number.MAX_SAFE_INTEGER);

    assert.equal(result, undefined);
});

test("lookupByBoss returns the matching nohit from json", async () => {
    const result = await nohitService.lookupByBoss("422320337758453761", "Death", "King Slime");

    assert.ok(result);
    assert.equal(result.ID, 1);
    assert.equal(result.Boss, "King Slime");
    assert.equal(result.Difficulty, "Death");
});

test("lookupByBoss returns undefined when no nohit matches", async () => {
    const result = await nohitService.lookupByBoss("422320337758453761", "Death", "Not A Boss");

    assert.equal(result, undefined);
});

test("totalNohits returns the number of stored nohits", async () => {
    const total = await nohitService.totalNohits();

    assert.equal(total, nohitService.nohitData.nohits.size);
    assert.ok(total > 0);
});

test("submit stores a pending nohit when the difficulty and boss are valid", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const created = await service.submit(
        "422320337758453761",
        "Death",
        "King Slime",
        "https://youtu.be/example",
        "first try"
    );

    assert.ok(created);
    assert.equal(created.ID, 1);
    assert.equal(created.UserID, "422320337758453761");
    assert.equal(created.Difficulty, "Death");
    assert.equal(created.Boss, "King Slime");
    assert.equal(created.Url, "https://youtu.be/example");
    assert.equal(created.UserComment, "first try");
    assert.equal(created.Verification, "Pending");
    assert.equal(created.JudgeComment, "Pending");
    assert.equal(created.JudgeID, 0);
    assert.equal(typeof created.Timestamp, "string");

    const stored = await service.lookup(1);
    assert.equal(stored, created);
    assert.equal(await service.totalNohits(), 1);
});

test("submit standardizes modifiers and boss aliases", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const created = await service.submit(123, "Def-S-D", "ks", "https://youtu.be/alias", "alias run");

    assert.ok(created);
    assert.equal(created.Difficulty, "Shroomed-Defiled-Death");
    assert.equal(created.Boss, "King Slime");
    assert.equal(created.UserID, 123);

    const found = await service.lookupByBoss("123", "S-Def-Death", "ks");
    assert.equal(found.ID, created.ID);
    assert.equal(found.Difficulty, "Shroomed-Defiled-Death");
});

test("submit assigns the next id for a different boss", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const first = await service.submit("7", "Death", "Eye of Cthulhu", "https://youtu.be/one", "one");
    const second = await service.submit("7", "Death", "King Slime", "https://youtu.be/two", "two");

    assert.equal(first.ID, 1);
    assert.equal(second.ID, 2);
    assert.equal(await service.totalNohits(), 2);

    const latest = await service.lookupByBoss("7", "Death", "King Slime");
    assert.equal(latest.ID, 2);
    assert.equal(latest.Url, "https://youtu.be/two");
});

test("submit returns undefined when the difficulty is unknown", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const created = await service.submit("7", "NotADifficulty", "King Slime", "https://youtu.be/x", "nope");

    assert.equal(created, undefined);
    assert.equal(await service.totalNohits(), 0);
});

test("submit returns undefined when the boss is not on that difficulty", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const created = await service.submit("7", "Death", "Providence", "https://youtu.be/x", "wrong boss");

    assert.equal(created, undefined);
    assert.equal(await service.totalNohits(), 0);
});

test("submit returns undefined when a modifier is not allowed", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const created = await service.submit("7", "Shroomed-Empyreal", "Providence", "https://youtu.be/x", "bad mod");

    assert.equal(created, undefined);
    assert.equal(await service.totalNohits(), 0);
});

test("submit adds the nohit id to a new user's difficulty list", async (t) => {
    const { dir, service, userData } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const userId = "422320337758453761";
    const created = await service.submit(
        userId,
        "Death",
        "King Slime",
        "https://youtu.be/example",
        "first try"
    );

    const user = userData.getUser(userId);
    assert.equal(user.ID, userId);
    assert.deepEqual(user.OwnedNohits.get("Death"), [created.ID]);
});

test("submit appends ids under each standardized difficulty", async (t) => {
    const { dir, service, userData } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const userId = "422320337758453761";
    const kingSlime = await service.submit(userId, "Death", "King Slime", "https://youtu.be/ks", "ks");
    const eye = await service.submit(userId, "D", "Eye of Cthulhu", "https://youtu.be/eye", "eye");
    const shroomed = await service.submit(userId, "S-D", "ks", "https://youtu.be/shroom", "shroom");

    const user = userData.getUser(userId);
    assert.equal(userData.users.size, 1);
    assert.deepEqual(user.OwnedNohits.get("Death"), [kingSlime.ID, eye.ID]);
    assert.deepEqual(user.OwnedNohits.get("Shroomed-Death"), [shroomed.ID]);
});

test("submit does not create a user when the submission is rejected", async (t) => {
    const { dir, service, userData } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const userId = "7";
    assert.equal(await service.submit(userId, "NotADifficulty", "King Slime", "https://youtu.be/x", "nope"), undefined);
    assert.equal(await service.submit(userId, "Death", "Providence", "https://youtu.be/x", "wrong boss"), undefined);
    assert.equal(await service.submit(userId, "Shroomed-Empyreal", "Providence", "https://youtu.be/x", "bad mod"), undefined);

    assert.equal(userData.users.has(userId), false);
});

test("submit does not change a user's nohit list when a later submission is rejected", async (t) => {
    const { dir, service, userData } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const userId = "7";
    const created = await service.submit(userId, "Death", "King Slime", "https://youtu.be/ok", "ok");
    const user = userData.getUser(userId);

    assert.equal(await service.submit(userId, "NotADifficulty", "Eye of Cthulhu", "https://youtu.be/x", "nope"), undefined);
    assert.equal(await service.submit(userId, "Death", "Providence", "https://youtu.be/x", "wrong boss"), undefined);
    assert.equal(await service.submit(userId, "Shroomed-Empyreal", "Providence", "https://youtu.be/x", "bad mod"), undefined);

    assert.deepEqual(user.OwnedNohits.get("Death"), [created.ID]);
    assert.equal(user.OwnedNohits.size, 1);
});

test("resubmitting a nohit properly overwrites the first nohit", async (t) => {
    const { dir, service, userData } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const userId = "7";
    const first = await service.submit(userId, "Death", "King Slime", "https://youtu.be/one", "one");
    first.Verification = "Verified";
    first.JudgeComment = "looks good";
    first.JudgeID = 99;

    const second = await service.submit(userId, "D", "ks", "https://youtu.be/two", "two");

    assert.equal(second.ID, first.ID);
    assert.equal(await service.totalNohits(), 1);
    const stored = await service.lookup(first.ID);
    assert.equal(stored, second);
    assert.equal(stored.Url, "https://youtu.be/two");
    assert.equal(stored.UserComment, "two");
    assert.equal(stored.Verification, "Pending");
    assert.equal(stored.JudgeComment, "Pending");
    assert.equal(stored.JudgeID, 0);

    const user = userData.getUser(userId);
    assert.deepEqual(user.OwnedNohits.get("Death"), [first.ID]);

    const other = await service.submit("8", "Death", "King Slime", "https://youtu.be/other", "other");
    assert.equal(other.ID, 2);
    assert.deepEqual(userData.getUser("8").OwnedNohits.get("Death"), [other.ID]);
    assert.deepEqual(user.OwnedNohits.get("Death"), [first.ID]);
});

test("submit reads difficulty objects imported from json", async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nohit-service-"));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const difficultiesPath = path.join(dir, "DifficultiesData.json");
    const aliasesPath = path.join(dir, "AliasesData.json");
    fs.writeFileSync(difficultiesPath, JSON.stringify([
        {
            name: "Revengeance",
            abbreviation: "R",
            isModifier: false,
            bosses: ["Desert Scourge"],
            allowedModifiers: ["Shroomed"]
        },
        {
            name: "Shroomed",
            abbreviation: "S",
            isModifier: true,
            bosses: [],
            allowedModifiers: []
        }
    ]));
    fs.writeFileSync(aliasesPath, JSON.stringify([
        { alias: "ds", boss: "Desert Scourge" }
    ]));

    const data = new JsonNohitDataAccess(path.join(dir, "NohitsData.json"), difficultiesPath, aliasesPath);
    const userData = new JsonUserDataAccess(path.join(dir, "UserData.json"));
    const service = new NohitService(data, userData);
    const created = await service.submit("9", "S-R", "ds", "https://youtu.be/imported", "from json");

    assert.ok(created);
    assert.equal(created.Difficulty, "Shroomed-Revengeance");
    assert.equal(created.Boss, "Desert Scourge");
    assert.equal((await service.lookupByBoss("9", "Revengeance", "Desert Scourge")), undefined);
    assert.equal((await service.lookupByBoss("9", "Shroomed-Revengeance", "Desert Scourge")).ID, created.ID);
});

test("recomment updates the stored user comment", async (t) => {
    const { dir, service } = createService();
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    await service.submit("7", "Death", "King Slime", "https://youtu.be/x", "old comment");
    await service.recomment(1, "new comment");

    const updated = await service.lookup(1);
    assert.equal(updated.UserComment, "new comment");
    assert.equal(updated.Boss, "King Slime");
});
