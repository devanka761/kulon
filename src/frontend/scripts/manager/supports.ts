// import "webrtc-adapter"

interface ISupports {
  ok: boolean
  list: string[]
}

export function isUnifiedSupported(): ISupports {
  const unsupporteds: string[] = []

  if (typeof RTCPeerConnection === "undefined") unsupporteds.push("RTCPeerConnection")
  if (typeof RTCDataChannel === "undefined") unsupporteds.push("RTCDataChannel")
  if (typeof RTCRtpTransceiver === "undefined") unsupporteds.push("RTCRtpTransceiver")
  if (typeof RTCRtpReceiver === "undefined") unsupporteds.push("RTCRtpReceiver")
  if (typeof WebSocket === "undefined") unsupporteds.push("WebSocket")
  let tempPc: RTCPeerConnection | null = null
  try {
    tempPc = new RTCPeerConnection()
    tempPc.addTransceiver("audio")
    tempPc.addTransceiver("video")
    tempPc.createDataChannel("makan")
  } catch (_) {
    unsupporteds.push("RTCPeerConnection")
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
