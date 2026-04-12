const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tx")
    .setDescription("check transaction")
    .addStringOption(option =>
      option
        .setName("txid")
        .setDescription("transaction id")
        .setRequired(true)
    ),

  async execute(interaction) {
    const txid = interaction.options.getString("txid");

    await interaction.deferReply();

    try {
      // 1. Fetch LTC transaction
      const txRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/txs/${txid}`);
      const txData = await txRes.json();

      if (txData.error) {
        return interaction.editReply("invalid transaction id");
      }

      const confirmations = txData.confirmations || 0;
      const amountLitoshi = txData.total || 0;
      const amountLTC = amountLitoshi / 100000000;

      // 2. Fetch LTC price in USD
      const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd");
      const priceData = await priceRes.json();

      const ltcPrice = priceData.litecoin.usd;
      const amountUSD = (amountLTC * ltcPrice).toFixed(2);

      const status = confirmations > 0 ? "confirmed" : "pending";

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle("crypto transaction")
        .addFields(
          { name: "tx id : ", value: `\`${txid}\`` },
          { name: "amount : ", value: `$${amountUSD}` },
          { name: "confirmations : ", value: `${confirmations}` },
          { name: "status : ", value: status }
        )

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply("error fetching transaction");
    }
  }
};
