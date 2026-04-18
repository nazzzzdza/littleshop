const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("alive"));
app.listen(PORT, () => console.log("Web server running on port", PORT));

// -------------------
// TOKEN DEBUG
// -------------------
const rawToken = process.env.TOKEN;
console.log("RAW TOKEN:", rawToken ? "EXISTS" : "MISSING");

const token = String(rawToken || "").trim();
console.log("TOKEN LENGTH:", token.length);

// -------------------
// CLIENT
// -------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// -------------------
// FULL DEBUG EVENTS
// -------------------
client.on("ready", () => {
  console.log("✅ READY EVENT FIRED");
  console.log("BOT:", client.user.tag);
});

client.on("error", (err) => {
  console.error("CLIENT ERROR:", err);
});

client.on("debug", (msg) => {
  console.log("DEBUG:", msg);
});

client.on("warn", (msg) => {
  console.log("WARN:", msg);
});

client.on("shardDisconnect", (event) => {
  console.log("DISCONNECTED:", event?.reason);
});

client.on("shardReconnecting", () => {
  console.log("RECONNECTING...");
});

// -------------------
// LOGIN
// -------------------
console.log("Attempting login...");

client.login(token)
  .then(() => console.log("LOGIN PROMISE RESOLVED"))
  .catch(err => console.error("LOGIN ERROR:", err));
