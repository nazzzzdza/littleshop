module.exports = {
  name: "autoresponder",

  async handleMessage(message) {
    if (message.author.bot) return;

    const supportRoleId = "1432683244805165199";

    if (message.content.toLowerCase().startsWith(".ask")) {

      if (!this.cooldowns) this.cooldowns = new Map();

      const now = Date.now();
      const cooldown = 5000;

      if (this.cooldowns.has(message.channel.id)) {
        const expiration = this.cooldowns.get(message.channel.id) + cooldown;
        if (now < expiration) return;
      }

      this.cooldowns.set(message.channel.id, now);

      await message.channel.send(
        `-# <@&${supportRoleId}> someone needs assistance <3`
      );
    }
  }
};
