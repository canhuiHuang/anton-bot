const { SlashCommandBuilder } = require("discord.js");
const { text } = require("./subcommands/text");
const { voice } = require("./subcommands/voice");
const { host } = require("./subcommands/host");
const fs = require("fs");

const data = new SlashCommandBuilder().setName("vs").setDescription("Versus");

const subcommandFiles = fs
  .readdirSync("./src/commands/versus/subcommands")
  .filter((file) => file.endsWith(".js"));

for (const file of subcommandFiles) {
  switch (file) {
    case "host.js":
      data.addSubcommand((subcommand) =>
        subcommand
          .setName("host")
          .setDescription("Versus by interface")
          .addIntegerOption((option) =>
            option.setName("teams").setDescription("Enter teams amount")
          )
      );
      break;
    case "voice.js":
      for (const alias of ["voice", "channel", "voz", "canal"]) {
        data.addSubcommand((subcommand) =>
          subcommand
            .setName(alias)
            .setDescription("Versus by voice channel")
            .addIntegerOption((option) =>
              option.setName("teams").setDescription("Enter teams amount")
            )
            .addStringOption((option) =>
              option
                .setName("filter")
                .setDescription(
                  "Enter list of players to filter separated by commas"
                )
            )
        );
      }
      break;
    case "text.js":
      for (const alias of ["text", "texto"]) {
        data.addSubcommand((subcommand) =>
          subcommand
            .setName(alias)
            .setDescription("Versus by text")
            .addIntegerOption((option) =>
              option.setName("teams").setDescription("Enter teams amount")
            )
        );
      }
      break;
    default:
      break;
  }
}

module.exports = {
  data,
  async execute(interaction, client) {
    const teamsAmount = interaction.options.getInteger("teams");
    const filter = interaction.options.getString("filter");
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "voice":
      case "channel":
      case "voz":
      case "canal":
        voice(interaction, client, teamsAmount, filter);
        break;
      case "host":
        host(interaction, client, teamsAmount);
      case "text":
      case "texto":
      default:
        text(interaction, client, teamsAmount);
        break;
    }
  },
};
