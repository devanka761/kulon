import { IAny, IRepB, IReqType } from "../types/LibTypes"

async function efetch(method: IReqType, url: string, s?: IAny): Promise<IRepB> {
  try {
    const response = await fetch(url, {
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
    return response
  } catch (err) {
    return { code: 404, ok: false, msg: "ERROR", errors: err }
  }
}

export default {
  async get(ref: string): Promise<IRepB | IAny> {
    return await efetch("GET", ref)
  },
  async post(ref: string, s?: IAny): Promise<IRepB> {
    return await efetch("POST", ref, s)
  }
}
