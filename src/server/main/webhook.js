const config = require("../config.json");
function sendToDiscord(channel_id, message) {
  if(!config.webhook || config.webhook !== true) return null;
  fetch(`https://discord.com/api/channels/${channel_id}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  }).catch(err => {
    console.error(err);
  });
}

const colors = { blurple:5793265, red:16739950, lime:7130225, yellow:13283420, fuchsia:15418781, cyan:65535 };

module.exports = {
  donation({username, userid, price, status, order_id}) {
    let currColor = "blurple";
    if(status === "created") { 
      currColor = "blurple";
    } else if (status === "settlement"){
      currColor = "lime";
    } else if (status === "deny" || status === "pending"){
      currColor = "yellow";
    } else if (status === "cancel" || status === "expire"){
      currColor = "red";
    }
    const message = {
      "embeds": [{
        "description": `${order_id.toUpperCase()}: Rp${price.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
        "color": colors[currColor],
        "author": { "name": `${username} (${userid})` },
        "footer": { "text": status }, "timestamp": new Date()
      }]
    }
    sendToDiscord(process.env.DISCORD_DONATION, message);
  },
  mail({userid, mail_id, rewards}) {
    const message = {
      "embeds": [{
        "description": "```" + rewards + "```",
        "color": colors.blurple,
        "author": { "name": `ID ${userid}` },
        "footer": { "text": mail_id }
      }]
    }
    sendToDiscord(process.env.DISCORD_MAIL, message);
  },
  exchange({userid, itemfrom, itemto}) {
    const message = {
      "embeds": [{
        "color": colors.yellow,
        "fields": [
          { "name": itemfrom.name, "value": "[- " + itemfrom.amount + "]", "inline": true },
          { "name": itemto.name, "value": "[+ " + itemto.amount + "]", "inline": true }
        ],
        "author": { "name": `ID ${userid}` }
      }]
    }
    sendToDiscord(process.env.DISCORD_EXCHANGE, message);
  },
  changeName({oldusername, newusername, userid}) {
    const message = {
      "embeds": [{
        "title": "Username Changed",
        "color": colors.blurple,
        "fields": [
          { "name": "from", "value": oldusername, "inline": true },
          { "name": "to", "value": newusername, "inline": true }
        ],
        "author": { "name": `User ID: ${userid}` }
      }]
    }
    sendToDiscord(process.env.DISCORD_CHANGENAME, message);
  },
  userLog({userid, status}) {
    const message = {
      "embeds": [{
        "description": `ID ${userid} ${status ? "JOINED" : "LEFT"}`,
        "color": colors[status ? "lime" : "red"]
      }]
    }
    sendToDiscord(process.env.DISCORD_USERLOG, message);
  }
}