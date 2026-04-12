const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

// shared storage (from index.js)
global.voiceConnections = global.voiceConnections || new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joinvc")
    .setDescription("make the bot stay in a voice channel")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("mention which vc")
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

    // join voice channel
    joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true
    });

    // store for auto-rejoin
    global.voiceConnections.set(interaction.guild.id, {
      channelId: channel.id
    });

    await interaction.reply({
      content: `joined **${channel.name}** ! `,
      ephemeral: true
    });
  }
};
