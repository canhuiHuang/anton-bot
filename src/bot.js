require("dotenv").config();

const token =
  process.env.NODE_ENV === "production"
    ? process.env.token
    : process.env.developToken;
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: GatewayIntentBits.Guilds });
client.clientId = "1010023818892419132";
client.commands = new Collection();
client.buttons = new Collection();
client.commandArray = [];
// client.color = "";

const functionFolders = fs.readdirSync("./src/functions");

for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of functionFiles) {
    require(`./functions/${folder}/${file}`)(client);
  }
}

client.handleEvents();
client.handleCommands();
client.handleComponents();
client.login(token);
