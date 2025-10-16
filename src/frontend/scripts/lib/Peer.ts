import { getPeerConfig } from "../data/peer.config"

type SignalDataType = "offer" | "answer" | "candidate"

interface ISignalData {
  type: SignalDataType
  sdp?: RTCSessionDescription | null
  candidate?: RTCIceCandidateInit
  video?: boolean
}

interface IPeerCallHandlerOptions {
  onSignal: (data: ISignalData) => void
  onDisconnected?: () => void
  onConnectionFailed?: () => void
  onMessage?: (message: string) => void
  onUnavailable?: () => void
}

export default class Peer {
  private peerConnection: RTCPeerConnection = new RTCPeerConnection(getPeerConfig())
  private dataChannel?: RTCDataChannel
  constructor(private options: IPeerCallHandlerOptions) {
    this._setupListeners()
  }
  private _setupListeners(): void {
    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.options.onSignal({ type: "candidate", candidate: e.candidate })
      }
    }

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState
      if (state === "closed" || state === "disconnected" || state === "failed") {
        this.options.onUnavailable?.()
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState
      if (state === "disconnected" || state === "closed") {
        this.options.onDisconnected?.()
      } else if (state === "failed") {
        this.options.onConnectionFailed?.()
      }
    }

    this.peerConnection.ondatachannel = (e) => {
      this.dataChannel = e.channel
      this._setupDataChannelEvents(this.dataChannel)
    }
  }

  private _setupDataChannelEvents(channel: RTCDataChannel): void {
    channel.onopen = () => {}
    channel.onerror = () => {}
    channel.onclose = () => this.options.onDisconnected?.()
    channel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data.toString())
        this.options.onMessage?.(msg)
      } catch (err) {
        console.warn("Message is not valid " + e.data, err)
      }
    }
  }

  call(): void {
    this.dataChannel = this.peerConnection.createDataChannel("control")
    this._setupDataChannelEvents(this.dataChannel)

    this.peerConnection.onnegotiationneeded = async () => {
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      this.options.onSignal({ type: "offer", sdp: this.peerConnection.localDescription })
    }
  }

  private async answer(offer: RTCSessionDescription): Promise<void> {
    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    this.options.onSignal({ type: "answer", sdp: this.peerConnection.localDescription })
  }

  async handleSignal(data: ISignalData) {
    if (this.peerConnection.signalingState === "closed") {
      this.close()
      return
    }
    if (data.type === "offer") {
      if (!data.sdp) {
        console.error("Failed to get RTCSessionDescriptionInit", data.sdp)
        return
      }
      await this.answer(data.sdp)
    } else if (data.type === "answer") {
      if (!data.sdp) {
        console.error("Failed to get RTCSessionDescriptionInit", data.sdp)
        return
      }
      const desc = new RTCSessionDescription(data.sdp)
      await this.peerConnection.setRemoteDescription(desc)
    } else if (data.type === "candidate" && data.candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (err) {
        console.error("Failed to add ICE candidate:", err)
      }
    }
  }

  close(): void {
    if (this.dataChannel) this.dataChannel.close()
    this.peerConnection.close()
  }

  send(message: { [key: string]: string | boolean | number | null }): void {
    try {
      const msg = JSON.stringify(message)
      if (this.dataChannel && this.dataChannel.readyState === "open") {
        this.dataChannel.send(msg)
      }
    } catch (err) {
      console.warn("Error sending message", err)
    }
  }
}
