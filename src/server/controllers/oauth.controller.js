const { isProd } = require("../main/helper");

const APP_DOMAIN = process.env.APP_DOMAIN;
const APP_PORT = process.env.APP_PORT;

const RedirectHost = isProd ? `https://${APP_DOMAIN}` : `http://localhost:${APP_PORT}`;

const CallBackURL = {
  google: {
    prod(state) {
      return `https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2F${APP_DOMAIN}%2Fx%2Fauth%2Fgoogle%2Fredirect&client_id=${process.env.GOOGLE_CLIENT_ID}&access_type=offline&response_type=code&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&state=${state}`;
    },
    dev(state) {
      return `https://accounts.google.com/o/oauth2/auth?redirect_uri=http%3A%2F%2Flocalhost%3A${APP_PORT}%2Fx%2Fauth%2Fgoogle%2Fredirect&client_id=${process.env.GOOGLE_CLIENT_ID}&access_type=offline&response_type=code&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&state=${state}`;
    }
  },
  github: {
    prod(state) {
      return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`;
    },
    dev(state) {
      return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`;
    },
  },
  discord: {
    prod(state) {
      return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=https%3A%2F%2F${APP_DOMAIN}%2Fx%2Fauth%2Fdiscord%2Fredirect&scope=identify&state=${state}`;
    },
    dev(state) {
      return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A${APP_PORT}%2Fx%2Fauth%2Fdiscord%2Fredirect&scope=identify&state=${state}`;
    },
  }
}

const RedirectURL = {
  async google(code) {
    const getAccess = await fetch("https://oauth2.googleapis.com/token", {
      "method": "POST", "headers": { "Content-Type": "application/json" },
      "body": JSON.stringify({
        "client_id": process.env.GOOGLE_CLIENT_ID,
        "client_secret": process.env.GOOGLE_CLIENT_SECRET,
        "code": code,
        "redirect_uri": `${RedirectHost}/x/auth/google/redirect`,
        "grant_type": "authorization_code"
      })
    }).then(res => res.json()).then(res => res).catch(err => {
      return {ok:false, errors: err, error: true};
    });
    if(!getAccess.access_token) return getAccess;
    const userInfo = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${getAccess.access_token}`, {
      "method": "GET",
      "headers": { "Authorization": `Bearer ${getAccess.id_token}` }
    }).then(res => res.json()).then(res => res).catch(err => {
      return {ok:false, errors: err, error: true};
    });
    if(!userInfo || userInfo.errors) return userInfo;
    return {ok:true, data: userInfo, provider: "google"};
  },
  async github(code) {
    const getAccess = await fetch("https://github.com/login/oauth/access_token", {
      "method": "POST", "headers": { "accept": "application/json", "Content-Type": "application/json" },
      "body": JSON.stringify({
        "client_id": process.env.GITHUB_CLIENT_ID,
        "client_secret": process.env.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": `https://${APP_DOMAIN}/x/auth/github/redirect`
      })
    }).then(res => res.json()).then(res => res).catch(err => {
      return {ok:false, errors: err, error: true};
    });
    if(!getAccess.access_token) return getAccess;
    const userInfo = await fetch("https://api.github.com/user", {
      "method": "GET",
      "headers": { "Authorization": `Bearer ${getAccess.access_token}` }
    }).then(res => res.json()).then(res => res).catch(err => {
      return {ok:false, errors: err, error: true};
    });
    if(!userInfo || userInfo.errors) return userInfo;
    return {ok:true, data: userInfo, provider: "github"};
  },
  async discord(code) {
    const getAccess = await fetch("https://discord.com/api/v10/oauth2/token", {
      "method": "POST", "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": new URLSearchParams({
        "client_id": process.env.DISCORD_CLIENT_ID,
        "client_secret": process.env.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": `${RedirectHost}/x/auth/discord/redirect`
      })
    }).then(res => res.json()).then(res => res).catch(err => {
      return {ok:false, errors: err, error: true};
    });
    if(!getAccess.access_token) return getAccess;
    const userInfo = await fetch("https://discord.com/api/v10/users/@me", {
      "method": "GET",
      "headers": { "Authorization": `Bearer ${getAccess.access_token}` }
    }).then(res => res.json()).then(res => res).catch(err => {
      return {ok:false, errors: err, error: true};
    });
    if(!userInfo || userInfo.errors) return userInfo;
    return {ok:true, data: userInfo, provider: "discord"};
  }
}

module.exports = {
  isProviderValid(provider) {
    const valid_provider = {google:1, discord:1, github:1};
    if(valid_provider[provider]) return true;
    return false;
  },
  auth(provider, returnPage = "/app", skipSplash = 0) {
    const queries = {};
    queries.returnPage = returnPage;
    if(!isNaN(Number(skipSplash)) && skipSplash >= 1) queries.skipSplash = skipSplash;
    const state = Buffer.from(JSON.stringify({returnPage,skipSplash})).toString("base64");
    const redirectUrl = CallBackURL[provider][isProd ? "prod" : "dev"](state);
    return redirectUrl;
  },
  async user({code, provider}) {
    const userData = await RedirectURL[provider](code);
    return userData;
  }
}