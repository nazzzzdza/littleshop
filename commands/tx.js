const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tx")
    .setDescription("check litecoin transaction")
    .addStringOption(option =>
      option
        .setName("txid")
        .setDescription("litecoin transaction id")
        .setRequired(true)
    ),

  async execute(interaction) {
    const txid = interaction.options.getString("txid");

    try {
      // ⚡ ALWAYS ACKNOWLEDGE IMMEDIATELY
      await interaction.deferReply();

      // fetch tx
      const txRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/txs/${txid}`);
      const txData = await txRes.json();

      if (!txData || txData.error) {
        return interaction.editReply("❌ invalid transaction id");
      }

      const confirmations = txData.confirmations || 0;
      const amountLitoshi = txData.total || 0;
      const amountLTC = amountLitoshi / 100000000;

      // price
      const priceRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd"
      );
      const priceData = await priceRes.json();

      const ltcPrice = priceData?.litecoin?.usd || 0;
      const amountUSD = (amountLTC * ltcPrice).toFixed(2);

      const status = confirmations > 0 ? "confirmed" : "pending";

      const embed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle("transaction")
        .addFields(
          { name: "tx id", value: `\`${txid}\`` },
          { name: "amount (USD)", value: `$${amountUSD}` },
          { name: "confirmations", value: `${confirmations}` },
          { name: "status", value: status }
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("TX ERROR:", err);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ error fetching transaction");
        } else {
          await interaction.reply({
            content: "❌ error fetching transaction",
            ephemeral: true
          });
        }
      } catch (e) {
        console.error("FINAL SAFETY ERROR:", e);
      }
    }
  }
};
