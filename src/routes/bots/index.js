const url = require('is-url');
const { Router } = require("express");

const resubmit = require("@routes/bots/resubmit");
const search = require("@routes/bots/search");
const edit = require("@routes/bots/edit");
const Bots = require("@models/bots");

const { server: {id} } = require("@root/config.json");

const route = Router();

route.use("/resubmit", resubmit);
route.use("/search", search);
route.use("/edit", edit);

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

route.get('/:id', async (req, res) => {
    let bot = await Bots.findOne({botid: req.params.id}, { _id: false, auth: false });
    
    const botUser = await req.app.get('client').users.fetch(req.params.id);
    if (bot.logo !== botUser.displayAvatarURL({format: "png"})) 
        await Bots.updateOne({ botid: req.params.id }, {$set: {logo: botUser.displayAvatarURL({format: "png"})}});    

    if (!bot) return res.sendStatus(404);
    if (bot.state === "deleted") return res.sendStatus(404);
    let owners;
    try {
        owners = (await req.app.get('client').guilds.cache.get(id).members.fetch({user: bot.owners})).map(x => { return x.user });
    } catch (e) {
        console.log(e)
        owners = [{tag: "Unknown User"}]
    }
    let b = "#8c8c8c";
    let c = botUser.presence.status
    switch (c) {
        case "online":
            b = "#32ff00"
            break;
        case "idle":
            b = "#ffaa00";
            break;
        case "dnd":
            b = "#ff0000";
            break;
    }
    var desc = ``;
    let isUrl = url(bot.long.replace("\n", "").replace(" ", ""))
    if (isUrl) {
        desc = `<iframe src="${bot.long.replace("\n", "").replace(" ", "")}" width="600" height="400" id="url-embed"><object data="${bot.long.replace("\n", "").replace(" ", "")}" width="600" height="400" style="width: 100%; height: 100vh;"><embed src="${bot.long.replace("\n", "").replace(" ", "")}" width="600" height="400" style="width: 100%; height: 100vh;"> </embed>${bot.long.replace("\n", "").replace(" ", "")}</object></iframe>`
    } else if (bot.long) desc = bot.long;
    else desc = bot.description;

    let servers;
    if (bot.servers[bot.servers.length - 1])
        servers = bot.servers[bot.servers.length - 1].count;
    else servers = null;

    let activity = ``;
    if (botUser.presence.activities.length) {
        activity += botUser.presence.activities[0].type.toLowerCase().capitalize()
        activity += " "
        activity += botUser.presence.activities[0].name
    }

    let discord_verified = (await botUser.fetchFlags()).has("VERIFIED_BOT")
    let data = {
        bot,
        botUser,
        servers,
        owners,
        desc,
        isUrl,
        activity,
        discord_verified,
        bcolour: b,
        user: req.user,
        isBotInfoPage: true
    };
    res.render("bots", data);
})

module.exports = route;