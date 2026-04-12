const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

// store active connection per guild
const connections = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joinvc")
    .setDescription("joins vc")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("channel")
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    if (!channel || !channel.isVoiceBased()) {
      return interaction.reply({
        content: "please select a valid voice channel",
        ephemeral: true
      });
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true
    });

    connections.set(interaction.guild.id, {
      connection,
      channelId: channel.id
    });

    await interaction.reply({
      content: `joined ${channel.name} !`,
      ephemeral: true
    });
  }
};
