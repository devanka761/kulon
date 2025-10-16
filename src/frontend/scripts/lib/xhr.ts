import { ISival, IRepB, IReqType } from "../../../backend/types/validate.types"

async function efetch(method: IReqType, url: string, s?: ISival): Promise<IRepB> {
  return await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: s ? JSON.stringify(s) : undefined
  })
    .then((res) => {
      return res.json()
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return { code: 404, ok: false, msg: "ERROR", errors: err }
    })
}

export default {
  async get(ref: string): Promise<IRepB> {
    return await efetch("GET", ref)
  },
  async post(ref: string, s?: ISival): Promise<IRepB> {
    return await efetch("POST", ref, s)
  }
}
