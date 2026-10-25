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

const COMMANDS = new Set(["lookup, submit, recomment, addboss, createdifficulty, addboss"]);
service.setClient(client);
client.on('messageCreate', async (message) => {
    if(message.author.bot){
        return;
    }
    if(message.content.startsWith("!")){
        const args = message.content.slice(1).split(" ");
        const commandName = args.shift().toLowerCase();
        if(COMMANDS.has(commandName)){
        try{
            const command = require(`./commands/${commandName}.js`);
            await command.run(message, args, client);
        }
        catch(err){
            console.log(err);
        }
    }
    }
    
});

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('Failed to log in:', err.message);
  process.exit(1);
});
