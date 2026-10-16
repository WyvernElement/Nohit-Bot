const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const nohitService = require("../service/NohitService");
const JsonNohitDataAccess = require("../dataaccess/JsonNohitDataAccess");

const backupPath = path.join(__dirname, "../Backup/NohitsData.json");

test("module exports a constructed NohitService instance", () => {
    assert.equal(typeof nohitService.lookup, "function");
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
