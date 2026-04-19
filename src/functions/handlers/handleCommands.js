const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const fs = require("fs");

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandFolders = fs.readdirSync("./src/commands");
    const { commands, commandArray } = client;
    const guildId = process.env.guild_id;

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

    const rest = new REST({ version: "10" }).setToken(process.env.token);

    try {
      const route = guildId
        ? Routes.applicationGuildCommands(client.clientId, guildId)
        : Routes.applicationCommands(client.clientId);

      console.log(
        `Refreshing application (/) commands${guildId ? ` for guild ${guildId}` : ""}.`
      );

      await rest.put(route, {
        body: commandArray,
      });

      console.log("Application (/) commands reloaded successfully.");
    } catch (error) {
      console.error(error);
    }
  };
};
