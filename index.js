const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------
// Express
// -------------------
app.get("/", (req, res) => {
  res.send("bot alive");
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

// -------------------
// Client
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// -------------------
// Commands loader
// -------------------
const commands = [];

if (fs.existsSync("./commands")) {
  const files = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const cmd = require(`./commands/${file}`);

      if (!cmd?.data?.name || !cmd?.execute) continue;

      client.commands.set(cmd.data.name, cmd);
      commands.push(cmd.data.toJSON());

      console.log("Loaded:", file);
    } catch (e) {
      console.log("Failed loading:", file);
      console.error(e);
    }
  }
}

// -------------------
// TOKEN FIX (IMPORTANT)
// -------------------
const token = process.env.TOKEN?.trim();

if (!token) {
  console.error("NO TOKEN FOUND IN ENV (TOKEN)");
  process.exit(1);
}

// -------------------
// REST
// -------------------
const rest = new (require("@discordjs/rest").REST)({ version: "10" }).setToken(token);

// -------------------
// READY
// -------------------
client.once("ready", async () => {
  console.log("BOT ONLINE:", client.user.tag);

  client.user.setPresence({
    activities: [{
      name: "processing orders <3",
      type: ActivityType.Playing
    }],
    status: "online"
  });

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("Slash commands registered");
  } catch (err) {
    console.error("Command register error:", err);
  }
});

// -------------------
// INTERACTIONS
// -------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "error executing command",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// -------------------
// LOGIN (FIXED + DEBUG)
// -------------------
console.log("TOKEN LENGTH:", token.length);

client.login(token)
  .then(() => console.log("LOGIN SUCCESS"))
  .catch(err => {
    console.error("LOGIN FAILED:", err);
  });
