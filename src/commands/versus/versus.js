const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vs")
    .setDescription("Versus")
    .addSubcommand((subcommand) =>
      subcommand.setName("host").setDescription("Versus by interface")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("voice")
        .setDescription("Versus by current voice channel")
    ),
  async execute(interaction, client) {
    // const message = await interaction.deferReply({
    //   fetchReply: true,
    // });

    switch (interaction.options.getSubcommand()) {
      case "voice":
      case "channel":
      case "voz":
      case "canal":
        break;
      case "host":
        const embed = new EmbedBuilder({
          title: "Versus",
          color: client.color,
          timestamp: Date.now(),
          fields: [
            {
              name: "Jugadores:",
              value:
                "user1, user2, user3, user1, user2, user3, user1, user2, user3,",
              inline: true,
            },
          ],
          footer: {
            iconURL: interaction.user.displayAvatarURL(),
            text: `Hosteado por ${interaction.user.tag}.`,
          },
        });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vs-join")
            .setLabel("Join")
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
          embeds: [embed],
          components: [row],
        });
      default:
        break;
    }

    // await interaction.editReply({
    //   content: result,
    // });
  },
};
