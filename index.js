require('dotenv').config();
const{Client, GatewayIntentBits, ActivityType} = require('discord.js');
const service = require('./service/DiscordService.js');
const NohitService = require("./service/NohitService.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });
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
addAlias("document", ["doc"]); // Remember to enclose any alias that's longer than 1 letter in an array too!
addAlias("lookup", "l");
addAlias("progress", "p");
addAlias("remaining", ["rem"]);
addAlias("overview", "o");
addAlias("nohitstats", ["stats", "stat"]);
addAlias("submit", "s");
addAlias("playlist", ["pl", "addplaylist"]);
addAlias("addboss", ["ab"]);
addAlias("addalias", ["aa"]);
addAlias("createdifficulty", ["cd"]);
addAlias("copydifficulty", ["cpd"]);
addAlias("recomment", ["rewritecomment"]);
addAlias("allowmodifier", ["allowmodifiers"]);
addAlias("catalogue", ["cat"]);
addAlias("catalogueall", ["catall"]);
addAlias("setup");
addAlias("config");

const JUDGING = new Map();
addJudgeAlias("judgerecomment", ["jrecomment", "jr"]);
addJudgeAlias("review", "r");

service.setClient(client);
client.on('messageCreate', async (message) => {
  if(message.author.bot){
      return;
  }
  console.log(message.content);
  if(message.content.startsWith("!")){
    const args = message.content.slice(1).split(" ");
    const commandAlias = args.shift().toLowerCase();
    const user = NohitService.userData.getUser(message.guildId, message.author.id);
    if(COMMANDS.has(commandAlias)){
      try{
          const commandName = COMMANDS.get(commandAlias);
          const command = require(`./commands/${commandName}.js`);
          await command.run(message, args, client, user);
      }
      catch(err){
          console.log(err);
      }
    }
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

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('Failed to log in:', err.message);
  process.exit(1);
});
