require('dotenv').config();
const{Client, GatewayIntentBits, ActivityType} = require('discord.js');
const service = require('./service/DiscordService.js');

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
addAlias("lookup", "l");
addAlias("submit", "s");
addAlias("progress", "p");
addAlias("overview", "o");
addAlias("recomment");
addAlias("addboss");
addAlias("createdifficulty");

service.setClient(client);
client.on('messageCreate', async (message) => {
    if(message.author.bot){
        return;
    }
    if(message.content.startsWith("!")){
        const args = message.content.slice(1).split(" ");
        const commandAlias = args.shift().toLowerCase();
        if(COMMANDS.has(commandAlias)){
        try{
            const commandName = COMMANDS.get(commandAlias);
            const command = require(`./commands/${commandName}.js`);
            await command.run(message, args, client);
        }
        catch(err){
            console.log(err);
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

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('Failed to log in:', err.message);
  process.exit(1);
});
