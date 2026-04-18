const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// ✅ FIX: ensure /data folder exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const filePath = path.join(dataDir, "vouches.json");

// ---------------- LOAD / SAVE ----------------
function loadVouches() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error("VOUCH LOAD ERROR:", err);
    return [];
  }
}

function saveVouches(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("VOUCH SAVE ERROR:", err);
  }
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
        .setDescription("add a vouch")
        .addUserOption(opt =>
          opt.setName("user").setRequired(true).setDescription("user")
        )
        .addStringOption(opt =>
          opt.setName("product").setRequired(true).setDescription("product")
        )
        .addStringOption(opt =>
          opt.setName("amount").setRequired(true).setDescription("amount")
        )
        .addStringOption(opt =>
          opt.setName("price").setRequired(true).setDescription("price")
        )
        .addStringOption(opt =>
          opt.setName("payment").setRequired(true).setDescription("payment")
        )
    )

    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("view vouches")
        .addUserOption(opt =>
          opt.setName("user").setRequired(true).setDescription("user")
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const vouches = loadVouches();

    // ADD
    if (sub === "add") {
      const user = interaction.options.getUser("user");
      const product = interaction.options.getString("product");
      const amount = interaction.options.getString("amount");
      const price = interaction.options.getString("price");
      const payment = interaction.options.getString("payment");

      const id = generateId();

      vouches.push({
        id,
        user: user.id,
        author: interaction.user.id,
        product,
        amount,
        price,
        payment
      });

      saveVouches(vouches);

      await interaction.channel.send(
`_ _
_ _     <a:c_butterflies:1332122946931790046> <@${user.id}>'s vouch !
_ _                   ﹒${amount}x ${product}
_ _                   ﹒for ${price} ${payment}`
      );

      return interaction.reply({ content: "vouch sent ♡", ephemeral: true });
    }

    // LIST
    if (sub === "list") {
      const user = interaction.options.getUser("user");
      const userVouches = vouches.filter(v => v.user === user.id);

      if (userVouches.length === 0) {
        return interaction.reply("no vouches found");
      }

      let page = 0;
      const perPage = 5;

      function buildEmbed(page) {
        const start = page * perPage;
        const current = userVouches.slice(start, start + perPage);

        return new EmbedBuilder()
          .setColor(0xFFFFFF)
          .setTitle("𑣲﹒naz's vouch list !")
          .setDescription(
            current.map(v =>
`_ _
_ _     <a:w_bunny:1493559677747990538> <@${user.id}>'s vouch !
_ _                   ﹒${v.amount}x ${v.product}
_ _                   ﹒for ${v.price} ${v.payment}
_ _                   ﹒#${v.id}`
            ).join("\n\n")
          )
          .setFooter({
            text: `page ${page + 1}/${Math.ceil(userVouches.length / perPage)}`
          });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vouch_prev")
          .setLabel("previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId("vouch_next")
          .setLabel("next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(userVouches.length <= perPage)
      );

      return interaction.reply({
        embeds: [buildEmbed(page)],
        components: [row]
      });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("vouch_")) return;

    const vouches = loadVouches();

    const desc = interaction.message.embeds[0]?.description;
    const matchUser = desc?.match(/<@(\d+)>/);
    if (!matchUser) return;

    const userId = matchUser[1];
    const userVouches = vouches.filter(v => v.user === userId);

    let page = 0;
    const footer = interaction.message.embeds[0]?.footer?.text;

    if (footer) {
      const match = footer.match(/page (\d+)/);
      if (match) page = parseInt(match[1]) - 1;
    }

    if (interaction.customId === "vouch_next") page++;
    if (interaction.customId === "vouch_prev") page--;

    const perPage = 5;
    const maxPage = Math.ceil(userVouches.length / perPage) - 1;

    if (page < 0) page = 0;
    if (page > maxPage) page = maxPage;

    function buildEmbed(page) {
      const start = page * perPage;
      const current = userVouches.slice(start, start + perPage);

      return new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle("𑣲﹒naz's vouch list !")
        .setDescription(
          current.map(v =>
`_ _
_ _     <a:w_bunny:1493559677747990538> <@${userId}>'s vouch !
_ _                   ﹒${v.amount}x ${v.product}
_ _                   ﹒for ${v.price} ${v.payment}
_ _                   ﹒#${v.id}`
          ).join("\n\n")
        )
        .setFooter({
          text: `page ${page + 1}/${Math.ceil(userVouches.length / perPage)}`
        });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("vouch_prev")
        .setLabel("previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),

      new ButtonBuilder()
        .setCustomId("vouch_next")
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
