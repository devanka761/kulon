const db = require("./db");

const userCDs = new Map();

module.exports = {
  cdUser(req, res, next) {
    const uid = req.session?.user?.id || 'unknown';

    if(userCDs.has(uid)) {
      if(Date.now() <= userCDs.get(uid)) return res.json({ok:false,code:429,msg:'TO_MANY_REQUEST'});
    }

    userCDs.set(uid, Date.now() + 1000);
    setTimeout(() => userCDs.delete(uid), 1000);
    return next();
  },
  isUser(req, res, next) {
    if(req.session?.user?.id) {
      if(db.ref.u[req.session.user.id]?.data) return next();
      return res.json({code:401,msg:'UNAUTHORIZED'});
    }
    return res.json({code:401,msg:'UNAUTHORIZED'});
  },
  isAdmin(req, res, next) {
    if(req.session?.user?.id) {
      const udb = db.ref.u[req.session.user.id];
      if(!udb || !udb.a || udb.a < 1) return {code:403, msg:"FORBIDDEN: THIS FEATURE CAN ONLY BE USED BY ADMIN"};
      return next();
    }
    return res.json({code:403,msg:"FORBIDDEN: THIS FEATURE CAN ONLY BE USED BY ADMIN"});
  }
}