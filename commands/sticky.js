const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const stickyMap = new Map(); 
// channelId -> { messageId, content }

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("sticky notes")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("The sticky message")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const channel = interaction.channel;
    const content = interaction.options.getString("message");

    // If sticky already exists in this channel
    if (stickyMap.has(channel.id)) {
      return interaction.reply({
        content: "a sticky note already exist here, delete the old one first",
        ephemeral: true
      });
    }

    const stickyMessage = await channel.send(content);

    stickyMap.set(channel.id, {
      messageId: stickyMessage.id,
      content: content
    });

    await interaction.reply({
      content: "new sticky made!!",
      ephemeral: true
    });
  },

  async handleMessage(message) {
    if (message.author.bot) return;

    const stickyData = stickyMap.get(message.channel.id);
    if (!stickyData) return;

    // If sticky was manually deleted, remove it from map
    try {
      await message.channel.messages.fetch(stickyData.messageId);
    } catch {
      stickyMap.delete(message.channel.id);
      return;
    }

    // Delete old sticky
    try {
      const oldSticky = await message.channel.messages.fetch(stickyData.messageId);
      await oldSticky.delete();
    } catch {}

    // Send new sticky at bottom
    const newSticky = await message.channel.send(stickyData.content);

    stickyMap.set(message.channel.id, {
      messageId: newSticky.id,
      content: stickyData.content
    });
  }
};
