import { ISival } from "../types/validate.types"

async function efetch(method: "POST" | "GET", url: string, authorization?: string | null, s?: ISival) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization || undefined
    },
    body: s ? JSON.stringify(s) : undefined
  }

  return await fetch(url, options as RequestInit)
    .then((res) => {
      if (res.ok) return res.json()
      return { error: true, errors: res }
    })
    .then((res) => res)
    .catch((err) => err)
}

const xhr = {
  async get(ref: string, authorization?: string | null) {
    return await efetch("GET", ref, authorization)
  },
  async post(ref: string, authorization?: string | null, s?: ISival) {
    return await efetch("POST", ref, authorization, s)
  }
}

export default xhr
