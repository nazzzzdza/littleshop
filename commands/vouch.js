const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ================= DB =================
const db = new sqlite3.Database(path.join(__dirname, "../data/vouches.db"));

// create table if not exists
db.run(`
CREATE TABLE IF NOT EXISTS vouches (
  id TEXT PRIMARY KEY,
  user TEXT,
  author TEXT,
  product TEXT,
  amount TEXT,
  price TEXT,
  payment TEXT
)
`);

const OWNER_ID = "827566073611419698";

function generateId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================= PROMISE HELPERS =================
function run(query, params = []) {
  return new Promise((res, rej) => {
    db.run(query, params, function (err) {
      if (err) rej(err);
      else res(this);
    });
  });
}

function all(query, params = []) {
  return new Promise((res, rej) => {
    db.all(query, params, (err, rows) => {
      if (err) rej(err);
      else res(rows);
    });
  });
}

// ================= COMMAND =================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("vouch system")

    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("add vouch")
        .addStringOption(opt =>
          opt.setName("product").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("amount").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("price").setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName("payment")
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
      sub.setName("list").setDescription("list vouches")
    )

    .addSubcommand(sub =>
      sub
        .setName("remove")
        .setDescription("remove vouch #id")
        .addStringOption(opt =>
          opt.setName("id").setRequired(true)
        )
    ),

  // ================= EXECUTE =================
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ================= ADD =================
    if (sub === "add") {
      const product = interaction.options.getString("product");
      const amount = interaction.options.getString("amount");
      const price = interaction.options.getString("price");
      const payment = interaction.options.getString("payment");

      const id = generateId();

      await run(
        `INSERT INTO vouches VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, OWNER_ID, interaction.user.id, product, amount, price, payment]
      );

      await interaction.channel.send(
` _ _
_ _     <a:w_kitty:1493560122465583134> <@${interaction.user.id}>'s vouch !
_ _                   ﹒${amount}x ${product}
_ _                   ﹒for ${price} ${payment}`
      );

      return interaction.reply({ content: "vouch saved ♡", ephemeral: true });
    }

    // ================= REMOVE =================
    if (sub === "remove") {
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({ content: "not allowed", ephemeral: true });
      }

      const id = interaction.options.getString("id");

      const result = await run(`DELETE FROM vouches WHERE id = ?`, [id]);

      if (result.changes === 0) {
        return interaction.reply({ content: "vouch not found", ephemeral: true });
      }

      return interaction.reply({ content: `removed #${id}`, ephemeral: true });
    }

    // ================= LIST =================
    if (sub === "list") {
      const rows = await all(`SELECT * FROM vouches WHERE user = ?`, [OWNER_ID]);

      if (!rows.length) return interaction.reply("no vouches found");

      let page = 0;
      const perPage = 5;

      const buildEmbed = (page) => {
        const start = page * perPage;
        const current = rows.slice(start, start + perPage);

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
            text: `page ${page + 1}/${Math.ceil(rows.length / perPage)}`
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
          .setDisabled(rows.length <= perPage)
      );

      await interaction.reply({
        embeds: [buildEmbed(page)],
        components: [row]
      });

      // store pagination state
      this.cache = rows;
    }
  },

  // ================= BUTTONS =================
  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    const rows = this.cache || [];
    const perPage = 5;

    let page = parseInt(
      interaction.message.embeds[0].footer.text.match(/page (\d+)/)[1]
    ) - 1;

    if (interaction.customId === "next") page++;
    if (interaction.customId === "prev") page--;

    const maxPage = Math.ceil(rows.length / perPage) - 1;

    if (page < 0) page = 0;
    if (page > maxPage) page = maxPage;

    const buildEmbed = (page) => {
      const start = page * perPage;
      const current = rows.slice(start, start + perPage);

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
          text: `page ${page + 1}/${Math.ceil(rows.length / perPage)}`
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
