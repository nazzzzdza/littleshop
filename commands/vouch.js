const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/vouches.json");

// YOUR ACCOUNT (person receiving vouches)
const OWNER_ID = "827566073611419698";

// ---------------- LOAD / SAVE ----------------
function loadVouches() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveVouches(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------------- MAIN ----------------
module.exports = {
  data: new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("vouch system")

    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("add vouch")

        .addStringOption(opt =>
          opt.setName("product").setDescription("product name only").setRequired(true)
        )

        .addStringOption(opt =>
          opt.setName("amount").setDescription("amount ex. 2x").setRequired(true)
        )

        .addStringOption(opt =>
          opt.setName("price").setDescription("price, add $/€").setRequired(true)
        )

        .addStringOption(opt =>
          opt
            .setName("payment")
            .setDescription("payment method")
            .setRequired(true)
            .addChoices(
              { name: "paypal", value: "paypal" },
              { name: "ltc", value: "ltc" },
              { name: "cashapp", value: "cashapp" },
              { name: "apple pay", value: "applepay" },
              { name: "robux", value: "robux" }
            )
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("list vouches")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const vouches = loadVouches();

    // ================= ADD =================
    if (sub === "add") {
      const product = interaction.options.getString("product");
      const amount = interaction.options.getString("amount");
      const price = interaction.options.getString("price");
      const payment = interaction.options.getString("payment");

      const id = generateId();

      vouches.push({
        id,
        user: OWNER_ID,
        author: interaction.user.id,
        product,
        amount,
        price,
        payment
      });

      saveVouches(vouches);

      await interaction.channel.send(
` _ _
_ _     <a:w_kitty:1493560122465583134> <@${interaction.user.id}>'s vouch !
_ _                   ﹒${amount}x ${product}
_ _                   ﹒for ${price} ${payment}`
      );

      return interaction.reply({ content: "vouch sent ♡", ephemeral: true });
    }

    // ================= LIST =================
    if (sub === "list") {
      const userVouches = vouches.filter(v => v.user === OWNER_ID);

      if (!userVouches.length) {
        return interaction.reply("no vouches found");
      }

      let page = 0;
      const perPage = 5;

      const buildEmbed = (page) => {
        const start = page * perPage;
        const current = userVouches.slice(start, start + perPage);

        return new EmbedBuilder()
          .setColor(0xFFFFFF)
          .setTitle("𑣲﹒naz's vouch list !")
          .setDescription(
            current.map(v =>
` _ _
_ _     <a:w_bunny:1493559677747990538> <@${v.author}>'s vouch !
_ _                   ﹒${v.amount}x ${v.product}
_ _                   ﹒for ${v.price} ${v.payment}
_ _                   ﹒#${v.id}`
            ).join("\n\n")
          )
          .setFooter({
            text: `page ${page + 1}/${Math.ceil(userVouches.length / perPage)}`
          });
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(userVouches.length <= perPage)
      );

      await interaction.reply({
        embeds: [buildEmbed(page)],
        components: [row]
      });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    const vouches = loadVouches();
    const userVouches = vouches.filter(v => v.user === OWNER_ID);

    let page = parseInt(interaction.message.embeds[0].footer.text.match(/page (\d+)/)[1]) - 1;

    if (interaction.customId === "next") page++;
    if (interaction.customId === "prev") page--;

    const perPage = 5;
    const maxPage = Math.ceil(userVouches.length / perPage) - 1;

    if (page < 0) page = 0;
    if (page > maxPage) page = maxPage;

    const buildEmbed = (page) => {
      const start = page * perPage;
      const current = userVouches.slice(start, start + perPage);

      return new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle("𑣲﹒naz's vouch list !")
        .setDescription(
          current.map(v =>
` _ _
_ _     <a:w_bunny:1493559677747990538> <@${v.author}>'s vouch !
_ _                   ﹒${v.amount}x ${v.product}
_ _                   ﹒for ${v.price} ${v.payment}
_ _                   ﹒#${v.id}`
          ).join("\n\n")
        )
        .setFooter({
          text: `page ${page + 1}/${Math.ceil(userVouches.length / perPage)}`
        });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),

      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === maxPage)
    );

    await interaction.update({
      embeds: [buildEmbed(page)],
      components: [row]
    });
  }
};
