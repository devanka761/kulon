interface IPeerConfig {
  config?: RTCConfiguration
}
const peerConfig: IPeerConfig = {}

export function setPeerConfig(config: RTCConfiguration): void {
  if (!config) return
  peerConfig.config = config
}

export function getPeerConfig(): RTCConfiguration | undefined {
  return peerConfig.config || undefined
}
