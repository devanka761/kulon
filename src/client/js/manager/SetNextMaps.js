import utils from "../main/utils.js";
import mapList from "./mapList.js";

export default function SetNextMap(nextMap, players_data=null) {
  Object.keys(mapList).forEach(previousMap => {
    delete mapList[previousMap];
  });
  Object.keys(nextMap).forEach(key => {
    mapList[key] = {};
    mapList[key].id = nextMap[key].id;
    mapList[key].lowerSrc = nextMap[key].lowerSrc;
    mapList[key].upperSrc = nextMap[key].upperSrc;
    mapList[key].configObjects = nextMap[key].configObjects || {};
    mapList[key].walls = {};
    mapList[key].cutsceneSpaces = {};
    mapList[key].safeZone = {};
    Object.values(mapList[key].configObjects).forEach(obj => {
      obj.x = utils.withGrid(obj.x);
      obj.y = utils.withGrid(obj.y);
      obj.talking?.forEach(tlk => {
        const reqs = tlk.required ? "required" : (tlk.local_req ? "local_req" : null);
        if(reqs && players_data?.uid) {
          const hasTemplate = tlk[reqs].filter(fg => fg.includes("{UID}"));
          const convertedTemplates = [];
          hasTemplate.forEach(fg => {
            const txt = fg.replace("{UID}", "");
            players_data.uid.forEach(uid => convertedTemplates.push(`${txt}${uid}`));
            tlk[reqs] = tlk[reqs].filter(old_fg => old_fg !== fg);
          });
          convertedTemplates.forEach(fg => tlk[reqs].push(fg));
        }
        tlk.events.forEach(evt => {
          if(evt.x) evt.x = utils.withGrid(evt.x);
          if(evt.y) evt.y = utils.withGrid(evt.y);
          if(players_data?.me && (evt.type === "addStoryFlag" || evt.type === "removeStoryFlag")) {
            const hasTemplate = evt.flag.filter(fg => fg.includes("{ME}"));
            const convertedTemplates = [];
            hasTemplate.forEach(fg => {
              const txt = fg.replace("{ME}", "");
              convertedTemplates.push(`${txt}${players_data.me}`);
              evt.flag = evt.flag.filter(old_fg => old_fg !== fg);
            });
            convertedTemplates.forEach(fg => evt.flag.push(fg));
          }
        });
      });
    });
    Object.keys(nextMap[key].walls || {}).forEach(obj => {
      const newCoor = obj.split(",");
      mapList[key].walls[utils.asGridCoord(newCoor[0], newCoor[1])] = nextMap[key].walls[obj];
    });
    Object.keys(nextMap[key].cutsceneSpaces || {}).forEach(obj => {
      const newCoor = obj.split(",");
      mapList[key].cutsceneSpaces[utils.asGridCoord(newCoor[0], newCoor[1])] = nextMap[key].cutsceneSpaces[obj];
    });
    Object.values(mapList[key].cutsceneSpaces).forEach(obj => {
      obj.forEach(tlk => {
        const reqs = tlk.required ? "required" : (tlk.local_req ? "local_req" : null);
        if(reqs && players_data?.uid) {
          const hasTemplate = tlk[reqs].filter(fg => fg.includes("{UID}"));
          const convertedTemplates = [];
          hasTemplate.forEach(fg => {
            const txt = fg.replace("{UID}", "");
            players_data.uid.forEach(uid => convertedTemplates.push(`${txt}${uid}`));
            tlk[reqs] = tlk[reqs].filter(old_fg => old_fg !== fg);
          });
          convertedTemplates.forEach(fg => tlk[reqs].push(fg));
        }
        tlk.events.forEach(evt => {
          if(evt.x) evt.x = utils.withGrid(evt.x);
          if(evt.y) evt.y = utils.withGrid(evt.y);
          if(players_data?.me && (evt.type === "addStoryFlag" || evt.type === "removeStoryFlag")) {
            const hasTemplate = evt.flag.filter(fg => fg.includes("{ME}"));
            const convertedTemplates = [];
            hasTemplate.forEach(fg => {
              const txt = fg.replace("{ME}", "");
              convertedTemplates.push(`${txt}${players_data.me}`);
              evt.flag = evt.flag.filter(old_fg => old_fg !== fg);
            });
            convertedTemplates.forEach(fg => evt.flag.push(fg));
          }
        });
      });
    });
    Object.keys(nextMap[key].safeZone).forEach(k => {
      mapList[key].safeZone[k] = utils.withGrid(nextMap[key].safeZone[k]);
    });
  });
}