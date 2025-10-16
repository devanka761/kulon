export class CharacterAPI {
  constructor(config) {
    this.user = config.user
    this.id = `crew_${config.user.id}`
    this.remote = config.remote
    this.mapId = config.mapId
    this.x = config.x
    this.y = config.y
    this.direction = config.direction
  }
  get skin() {
    return this.user.skin
  }
  setMapId(newMapId) {
    this.mapId = newMapId
  }
  setX(newX) {
    this.x = newX
  }
  setY(newY) {
    this.y = newY
  }
  setCustomCoor(coor, newCoor) {
    if (!["x", "y"].find((oldCoor) => oldCoor === coor)) return
    this[coor] = newCoor
  }
  setDirection(newDirection) {
    this.direction = newDirection
  }
  send(msg) {
    this.remote.send(msg)
  }
  close() {
    this.remote.close()
  }
}
