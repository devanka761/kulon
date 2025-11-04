import { getPeerConfig } from "../data/peer.config"

type SignalDataType = "offer" | "answer" | "candidate"

interface ISignalData {
  type: SignalDataType
  sdp?: RTCSessionDescription | null
  candidate?: RTCIceCandidateInit
  video?: boolean
}

interface IPeerCallHandlerOptions {
  onOpened?: () => void
  onClosed?: () => void
  onSignal: (data: ISignalData) => void
  onDisconnected?: () => void
  onConnectionFailed?: () => void
  onMessage?: (message: string) => void
  onUnavailable?: () => void
}

export default class Peer {
  private peerConnection: RTCPeerConnection = new RTCPeerConnection(getPeerConfig())
  private dataChannel?: RTCDataChannel
  private stopped: boolean = false
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
        if (this.stopped) {
          this.peerConnection.oniceconnectionstatechange = null
          this.peerConnection.onconnectionstatechange = null
          return
        }
        this.stopped = true
        this.options.onUnavailable?.()
        this.options.onClosed?.()
        this.peerConnection.oniceconnectionstatechange = null
        this.peerConnection.onconnectionstatechange = null
        this.close()
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState
      if (state === "disconnected" || state === "closed") {
        if (this.stopped) {
          this.peerConnection.oniceconnectionstatechange = null
          this.peerConnection.onconnectionstatechange = null
          return
        }
        this.stopped = true
        this.options.onDisconnected?.()
        this.options.onClosed?.()
        this.dataChannel?.close()
        this.peerConnection.onconnectionstatechange = null
        this.peerConnection.oniceconnectionstatechange = null
        this.close()
      } else if (state === "failed") {
        if (this.stopped) {
          this.peerConnection.oniceconnectionstatechange = null
          this.peerConnection.onconnectionstatechange = null
          return
        }
        this.stopped = true
        this.options.onConnectionFailed?.()
        this.options.onClosed?.()
        this.dataChannel?.close()
        this.peerConnection.onconnectionstatechange = null
        this.peerConnection.oniceconnectionstatechange = null
        this.close()
      }
    }

    this.peerConnection.ondatachannel = (e) => {
      this.dataChannel = e.channel
      this._setupDataChannelEvents(this.dataChannel)
    }
  }

  private _setupDataChannelEvents(channel: RTCDataChannel): void {
    channel.onopen = () => this.options.onOpened?.()

    channel.onerror = () => {}
    channel.onclose = () => {
      if (this.stopped) {
        channel.onclose = null
        this.peerConnection.oniceconnectionstatechange = null
        this.peerConnection.onconnectionstatechange = null
        return
      }
      this.stopped = true
      this.options.onDisconnected?.()
      this.options.onClosed?.()
      channel.onclose = null
      this.close()
    }
    channel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data.toString())
        this.options.onMessage?.(msg)
      } catch (_err) {
        // console.warn("Message is not valid " + e.data, err)
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
        // console.error("Failed to get RTCSessionDescriptionInit", data.sdp)
        return
      }
      await this.answer(data.sdp)
    } else if (data.type === "answer") {
      if (!data.sdp) {
        // console.error("Failed to get RTCSessionDescriptionInit", data.sdp)
        return
      }
      const desc = new RTCSessionDescription(data.sdp)
      await this.peerConnection.setRemoteDescription(desc)
    } else if (data.type === "candidate" && data.candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (_err) {
        // console.error("Failed to add ICE candidate:", err)
      }
    }
  }

  close(): void {
    if (this.dataChannel) this.dataChannel.close()
    this.peerConnection.close()
  }

  onOpened(fn?: () => void): void {
    if (fn) this.options.onOpened = () => fn()
  }

  onClosed(fn?: () => void): void {
    if (fn) this.options.onClosed = () => fn()
  }

  send(message: { [key: string]: string | boolean | number | null }): void {
    try {
      const msg = JSON.stringify(message)
      if (this.dataChannel && this.dataChannel.readyState === "open") {
        this.dataChannel.send(msg)
      }
    } catch (_err) {
      // console.warn("Error sending message", err)
    }
  }
}
