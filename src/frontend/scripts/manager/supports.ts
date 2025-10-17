// import "webrtc-adapter"

interface ISupports {
  ok: boolean
  list: string[]
}

export function isUnifiedSupported(): ISupports {
  const unsupporteds: string[] = []

  if (typeof RTCPeerConnection === "undefined") unsupporteds.push("RTCPeerConnection")
  if (typeof RTCDataChannel === "undefined") unsupporteds.push("RTCDataChannel")
  if (typeof WebSocket === "undefined") unsupporteds.push("WebSocket")
  if (typeof AudioContext === "undefined") unsupporteds.push("AudioContext")
  if (typeof AudioBuffer === "undefined") unsupporteds.push("AudioBuffer")
  if (typeof CanvasRenderingContext2D === "undefined") unsupporteds.push("CanvasRenderingContext2D")

  let tempPc: RTCPeerConnection | null = null
  try {
    tempPc = new RTCPeerConnection()
    tempPc.createDataChannel("makan")
  } catch (_) {
    unsupporteds.push("RTCSessionDescription")
  } finally {
    if (tempPc) {
      tempPc.close()
    }
  }
  return {
    ok: unsupporteds.length < 1,
    list: unsupporteds
  }
}
