const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandFolders = fs.readdirSync("./src/commands");
    const { commands, commandArray } = client;

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./src/commands/${folder}`)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const command = require(`../../commands/${folder}/${file}`);
        commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
        console.log(`Command ${command.data.name} has been registered.`);
      }
    }

    const clientId = "1010023818892419132";

    const rest = new REST({ version: "9" }).setToken(process.env.token);
    try {
      console.log("Refreshing application (/) commands.");

      await rest.put(Routes.applicationCommands(clientId), {
        body: commandArray,
      });

      console.log("Application (/) commands reloaded successfully.");
    } catch (error) {
      console.error(error);
    }
  };
};
