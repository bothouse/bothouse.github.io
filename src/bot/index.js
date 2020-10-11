
const { Client, Schema } = require('klasa');
const {server: {admin_user_ids}, discord_client: {prefix}} = require("@root/config.json");

Client.defaultPermissionLevels
    .add(8, ({ c, author }) => admin_user_ids.includes(author.id));

const client = new Client({
    commandEditing: true,
    prefix: prefix,
    production: true,
    consoleEvents: {
        log: false,
        error: false,
        warn: false
    },
    disabledCorePieces: ["commands"]
});

//Bot Status
client.once('ready', () => {
    client.user.setActivity('to decline your bot ;)', { type: "PLAYING" });
});

module.exports.init = async (token) => {
    client.userBaseDirectory = __dirname;
    await client.login(token);
    return client;
}
