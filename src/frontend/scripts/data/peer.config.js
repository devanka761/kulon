const peerConfig = {}

export function setPeerConfig(config) {
  if (!config) return
  peerConfig.config = config
}

export function getPeerConfig() {
  return peerConfig.config || undefined
}
