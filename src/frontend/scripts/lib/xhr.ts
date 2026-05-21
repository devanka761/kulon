import { IAny, IRepB, IReqType } from "../types/LibTypes"
import waittime from "./waittime"

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

async function forceFetchGet(ref: string): Promise<IRepB | IAny> {
  const response = await efetch("GET", ref)
  if (response.errors) {
    await waittime(300)
    return forceFetchGet(ref)
  }
  return response
}
async function forceFetchPost(ref: string, s?: IAny): Promise<IRepB | IAny> {
  const response = await efetch("POST", ref, s)
  if (response.errors) {
    await waittime(300)
    return forceFetchPost(ref, s)
  }
  return response
}

export default {
  async get(ref: string): Promise<IRepB | IAny> {
    return await efetch("GET", ref)
  },
  async post(ref: string, s?: IAny): Promise<IRepB> {
    return await efetch("POST", ref, s)
  },
  async forceGet(ref: string): Promise<IRepB | IAny> {
    return await forceFetchGet(ref)
  },
  async forcePost(ref: string, s?: IAny): Promise<IRepB> {
    return await forceFetchPost(ref, s)
  }
}
