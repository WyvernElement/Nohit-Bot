require('dotenv').config();
const{Client, GatewayIntentBits, Partials, ActivityType} = require('discord.js');
const service = require('./service/DiscordService.js');
const NohitService = require("./service/NohitService.js");
const ModerationService = require("./service/ModerationService.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates], partials: [ Partials.Channel ]});
client.on('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    activities: [{
      name: "nohit bot message",
      type: ActivityType.Custom,
      state: "Watching your cringe nohits"
    }],
    status: 'online'
  });
});

const COMMANDS = new Map();
addAlias("help", "h");
addAlias("document", ["doc"]); // Remember to enclose any alias that's longer than 1 letter in an array too!
addAlias("lookup", "l");
addAlias("random", ["r", "rand"]);
addAlias("progress", "p");
addAlias("remaining", ["rem"]);
addAlias("timeline", "t");
addAlias("overview", "o");
addAlias("nohitstats", ["stats", "stat"]);
addAlias("submit", "s");
addAlias("queue", "q");
addAlias("aliases", "a");
addAlias("requestreview", ["rr"]);
addAlias("removerequest", ["rrr"]);
addAlias("playlist", ["pl", "addplaylist"]);
addAlias("journeycomment", ["jcommment", "jc"]);
addAlias("recomment", ["rewritecomment", "rc"]);
addAlias("catalogue", ["cat"]);
addAlias("catalogueall", ["catall"]);
addAlias("veterans", "v");
addAlias("await");

const JUDGING = new Map();
addJudgeAlias("judgerecomment", ["jrecomment", "jr"]);
addJudgeAlias("review", "r");
addJudgeAlias("delete", "d");
addJudgeAlias("ignorejourney", ["ij", "ignore"]);
addJudgeAlias("addalias", ["aa"]);
addJudgeAlias("allowmodifier", ["allowmodifiers", "am"]);
addJudgeAlias("togglesubmissions", ["toggle", "ts"]);
addJudgeAlias("createdifficulty", ["cd"]);
addJudgeAlias("copydifficulty", ["cpd"]);
addJudgeAlias("addboss", ["ab"]);

const ADMIN = new Map();
addAdminAlias("config");
addAdminAlias("addreviewchannel", ["arc"]);
addAdminAlias("setup");


service.setClient(client);
client.on('messageCreate', async (message) => {
  if (await ModerationService.moderate(message, client)){

    const maps = NohitService.userData.users.values();
    const userInstances = [];
    for (const map of maps){
      userInstances.push(map.get(message.author.id));
    }
    if (!message.guildId){
      const newId = userInstances[0].recentGuildId
      if (newId){
        message.guildId = newId;
      }
      else{
        return message.reply("Interact with the bot in a server to access it in DMs!");
      }
    }
    else{
      for (const user of userInstances){
        user.recentGuildId = message.guildId;
      }
    }
    

    if (message.content.startsWith("!")){
      const args = message.content.slice(1).split(" ");
      const commandAlias = args.shift().toLowerCase();
      const user = NohitService.userData.getUser(message.guildId, message.author.id);

      if(JUDGING.has(commandAlias)){
        if (!NohitService.checkJudge(message.guildId, message.author.id)){
          message.reply("You're not a judge lol get outta here")
        }
        else{
          try{
            const commandName = JUDGING.get(commandAlias);
            const command = require(`./commands/judging/${commandName}.js`);
            await command.run(message, args, client, user);
          }
          catch(err){
            console.log(err);
          }
        }
      }
      else if(COMMANDS.has(commandAlias)){
        try{
            const commandName = COMMANDS.get(commandAlias);
            const command = require(`./commands/${commandName}.js`);
            await command.run(message, args, client, user);
        }
        catch(err){
            console.log(err);
        }
      }
      else if(ADMIN.has(commandAlias)){
        if (false){
          message.reply("only registered bot admins can use this command")
        }
        else{
          try{
            const commandName = ADMIN.get(commandAlias);
            const command = require(`./commands/admin/${commandName}.js`);
            await command.run(message, args, client, user);
          }
          catch(err){
            console.log(err);
          }
        }
      }
    }
  }
});

function addAlias(command, aliases){
  COMMANDS.set(command, command);
  if(aliases != undefined){
    for(const alias of aliases){
      COMMANDS.set(alias, command);
    }
  }
}

function addJudgeAlias(command, aliases){
  JUDGING.set(command, command);
  if(aliases != undefined){
    for(const alias of aliases){
      JUDGING.set(alias, command);
    }
  }
}

function addAdminAlias(command, aliases){
  ADMIN.set(command, command);
  if(aliases != undefined){
    for(const alias of aliases){
      ADMIN.set(alias, command);
    }
  }
}

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('Failed to log in:', err.message);
  process.exit(1);
});
