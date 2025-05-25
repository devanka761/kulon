import * as klang from "./lang.js";

export default {
  sameday(t1, t2) {
    t1 = new Date(t1);
    t2 = new Date(t2);
    return t1.getFullYear() === t2.getFullYear() && t1.getMonth() === t2.getMonth() && t1.getDate() === t2.getDate();
  },
  time(ts) {
    return new Date(ts).toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });
  },
  date(ts) {
    return new Date(ts).toLocaleDateString(navigator.language, { year: '2-digit', month: '2-digit', day: '2-digit' })
  },
  datetime(ts, pq = null) {
    return this.date(ts) + (pq ? ' ' + pq + ' ' : ' ') + this.time(ts);
  },
  timeago(ts, islong=false) {
    const lang = klang.lang;
    const seconds = Math.floor((new Date() - new Date(ts)) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} ${lang.SDATE_YEARS}${islong?' '+lang.SDATE_AGO:''}`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} ${lang.SDATE_MONTHS}${islong?' '+lang.SDATE_AGO:''}`;

    interval = Math.floor(seconds / 604800);
    if (interval >= 1) return `${interval} ${lang.SDATE_WEEKS}${islong?' '+lang.SDATE_AGO:''}`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} ${lang.SDATE_DAYS}${islong?' '+lang.SDATE_AGO:''}`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} ${lang.SDATE_HOURS}${islong?' '+lang.SDATE_AGO:''}`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} ${lang.SDATE_MINUTES}${islong?' '+lang.SDATE_AGO:''}`;

    interval = Math.floor(seconds / 1);
    if (interval >= 1) return `${seconds} ${lang.SDATE_SECONDS}${islong?' '+lang.SDATE_AGO:''}`;

    return `${lang.SDATE_JUSTNOW}`;
  },
  durrTime(ms) {
    const lang = klang.lang;

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor((totalSeconds / 3600) / 24);
    const hours = Math.floor(((totalSeconds % (3600 * 24)) / 3600) );
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = "";
    if(days > 0) {
      result += `${days}${lang.SDATE_sDAYS} `;
    }
    if(hours > 0) {
      result += `${hours}${lang.SDATE_sHOURS} `;
    }
    if(minutes > 0) {
      result += `${minutes}${lang.SDATE_sMINUTES} `;
    }
    if(seconds > 0 || result === "") {
      result += `${seconds}${lang.SDATE_sSECONDS}`;
    }
    return result.trim();
  },
  remain(expiryTime) {
    const remaining = expiryTime - Date.now();
    return remaining > 0 ? this.durrTime(remaining) : null;
  },
  remainOld(expiryTime) {
    const now = Date.now();
    let remaining = expiryTime - now;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    remaining %= 1000 * 60 * 60 * 24;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    remaining %= 1000 * 60 * 60;

    const minutes = Math.floor(remaining / (1000 * 60));
    remaining %= 1000 * 60;

    const seconds = Math.floor(remaining / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}hr`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  }
}