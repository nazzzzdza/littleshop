const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  name: 'joinvc',
  description: 'joins a vc',

  async execute(message) {
    if (!message.member.voice.channel) {
      return message.reply('you need to join a voice channel first !');
    }

    const channel = message.member.voice.channel;

    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      message.reply(`joined ${channel.name} !`);
    } catch (err) {
      console.error(err);
      message.reply('failed to join the voice channel :(');
    }
  },
};
