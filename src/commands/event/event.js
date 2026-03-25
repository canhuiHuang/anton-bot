const { ButtonStyle } = require('discord-api-types/v10');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("event").setDescription("Create event with participants"),
  async execute(interaction, client) {
    // const message = await interaction.deferReply({
    //   fetchReply: true,
    // });

    // const newMessage = `API Latency: ${client.ws.ping}\nClient ping: ${
    //   message.createdTimestamp - interaction.createdTimestamp
    // }`;
    // await interaction.editReply({
    //   content: newMessage,
    // });

    const fields = [
      {
        name: `xd`,
        value: "uno dos\n tres",
        inline: true,
      },
      {
        name: `xd2`,
        value: "unox dos\n tresx",
        inline: true,
      },
      {
        name: "xd3",
        value: "unoy dos\n tresy ",
        inline: true,
      }
    ]

    const joinBtn = new ButtonBuilder()
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary)
      .setCustomId('join-event');

    const leaveBtn = new ButtonBuilder()
      .setLabel('Leave')
      .setStyle(ButtonStyle.Danger)
      .setCustomId('left-event');

    const actionsRow = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

    const embed = new EmbedBuilder({
      title: "hola mundo",
      color: client.color,
      timestamp: Date.now(),
      fields,
      footer: {
        iconURL: interaction.user.displayAvatarURL(),
        text: `Creado por ${interaction.user.username}.`,
      },
    });

    const filter = (i) => {
      return true;
    };

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 3000,
    });

    collector.on("collect", async (i) => {
      switch (i.customId) {
        case "join-event":
          await interaction.reply({ content: 'You joined the event', ephemeral: true });
          break;
        case "leave-event":
          await interaction.reply({ content: 'You left the event', ephemeral: true });
          break;

        default:
          break;
      }
      await i.update({
        components: [row],
      });
    });

    collector.on("end", async (collected) => {
      // interaction.reply({
      //   content: "collector ended",
      // });
      console.log("ended collector")
    });

    interaction.reply({
      embeds: [embed],
      components: [actionsRow]
    });
  },
};
