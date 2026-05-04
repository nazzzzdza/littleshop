const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

// ============================
// SUPABASE (SAFE MODE - NO REALTIME)
// ============================

const { createClient } = require("@supabase/supabase-js");

// 🔥 HARD DISABLE EVERYTHING REALTIME CAN TOUCH
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    realtime: {
      enabled: false,
      params: {
        eventsPerSecond: 0
      }
    },
    global: {
      headers: {
        "X-Client-Info": "disabled-realtime"
      }
    }
  }
);

module.exports.supabase = supabase;

// ============================
// EXPRESS KEEP ALIVE (RENDER)
// ============================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("polka's helper is alive, checking your orders!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ============================
// DISCORD CLIENT
// ============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ============================
// LOAD COMMANDS
// ============================
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (command.data) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// ============================
// TOKEN + REST
// ============================
const token = String(process.env.TOKEN || "").trim();

const rest = new REST({ version: "10" }).setToken(token);

// ============================
// READY EVENT
// ============================
client.once("ready", async () => {
  console.log(`polka's helper is online as ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      {
        name: "processing your orders <3",
        type: 1,
        url: "https://www.twitch.tv/discord"
      }
    ],
    status: "online"
  });

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("Slash commands registered.");
  } catch (error) {
    console.error("Slash command error:", error);
  }
});

// ============================
// INTERACTION HANDLER
// ============================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "there was an error executing that command.",
          ephemeral: true
        });
      }
    }
  }

  else {
    for (const command of client.commands.values()) {
      if (typeof command.handleInteraction === "function") {
        try {
          await command.handleInteraction(interaction);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
});

// ============================
// LOGIN
// ============================
console.log("Token loaded:", token ? "YES" : "NO");

client.login(token)
  .then(() => {
    console.log("Discord login successful");
  })
  .catch((err) => {
    console.error("Discord login failed:", err);
  });
