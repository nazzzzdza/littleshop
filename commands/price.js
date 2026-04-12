const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");

// fees
const METHODS = {
  cashapp_teen: { name: "cashapp -18", fee: 4, currency: "$" },
  cashapp_adult: { name: "cashapp +18", fee: 4, currency: "$" },
  paypal_eur: { name: "paypal €", fee: 7, currency: "€" },
  paypal_usd: { name: "paypal $", fee: 2, currency: "$" },
  applepay: { name: "apple pay", fee: 2, currency: "$" },
  ltc: { name: "ltc", fee: 0, currency: "$" }
};

function calculate(amount, feePercent) {
  const fee = (amount * feePercent) / 100;
  const total = amount + fee;
  return {
    fee: fee.toFixed(2),
    total: total.toFixed(2)
  };
}

function buildEmbed(user, amount, methodKey) {
  const method = METHODS[methodKey];
  const calc = calculate(amount, method.fee);

  return new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setTitle("𑣲﹒price calculation ")
    .setDescription(
      `﹒ u**se**r: <@${user.id}>\n\n` +
      `﹒ **a**mo__un__t : ${method.currency}${amount}\n` +
      `﹒ m__eth__o**d** : ${method.name}\n\n` +
      `﹒ **f**e__e__ : ${method.fee}% (${method.currency}${calc.fee})\n` +
      `﹒ __to__t**a**l : ${method.currency}${calc.total}\n\n` +
      `﹒ __y__ou r**ece**i__v__e : ${method.currency}${amount}`
    )
    .setTimestamp();
}

function buildButtons(active) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("price_cashapp_teen")
      .setLabel("cashapp -18")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "cashapp_teen"),

    new ButtonBuilder()
      .setCustomId("price_cashapp_adult")
      .setLabel("cashapp +18")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "cashapp_adult"),

    new ButtonBuilder()
      .setCustomId("price_paypal_eur")
      .setLabel("paypal €")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "paypal_eur"),

    new ButtonBuilder()
      .setCustomId("price_paypal_usd")
      .setLabel("paypal $")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "paypal_usd"),

    new ButtonBuilder()
      .setCustomId("price_applepay")
      .setLabel("apple pay")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(active === "applepay")
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("price")
    .setDescription("calculate price with fees")
    .addNumberOption(option =>
      option.setName("amount")
        .setDescription("base amount")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("method")
        .setDescription("payment method")
        .setRequired(true)
        .addChoices(
          { name: "cashapp -18", value: "cashapp_teen" },
          { name: "cashapp +18", value: "cashapp_adult" },
          { name: "paypal €", value: "paypal_eur" },
          { name: "paypal $", value: "paypal_usd" },
          { name: "apple pay", value: "applepay" },
          { name: "ltc", value: "ltc" }
        )
    ),

  async execute(interaction) {
    const amount = interaction.options.getNumber("amount");
    const method = interaction.options.getString("method");

    const embed = buildEmbed(interaction.user, amount, method);

    await interaction.reply({
      embeds: [embed],
      components: [buildButtons(method)]
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("price_")) return;

    const method = interaction.customId.replace("price_", "");

    const oldEmbed = interaction.message.embeds[0];
    if (!oldEmbed) return;

    // Extract amount from embed text
    const match = oldEmbed.description.match(/amount: [€$](\d+(\.\d+)?)/);
    if (!match) return;

    const amount = parseFloat(match[1]);

    const newEmbed = buildEmbed(interaction.user, amount, method);

    await interaction.update({
      embeds: [newEmbed],
      components: [buildButtons(method)]
    });
  }
};
