const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

// shared storage
global.voiceConnections = global.voiceConnections || new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joinvc")
    .setDescription("joins vc")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("mention vc")
        .addChannelTypes(ChannelType.GuildVoice) //
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    if (!interaction.guild) {
      return interaction.reply({
        content: "this command can only be used in a server",
        ephemeral: true
      });
    }

    if (!channel) {
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
