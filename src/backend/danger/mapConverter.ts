/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs"
import mapdata from "../../../public/json/maps/backup.mp_strange_distric.json"

const filepath = "./public/json/maps/mp_strange_distric.json"

function convertMapData(): void {
  const data = JSON.parse(JSON.stringify(mapdata))

  function convertCoordinates(current: any): void {
    if (current === null || typeof current !== "object") {
      return
    }

    if (Object.prototype.hasOwnProperty.call(current, "x") && Object.prototype.hasOwnProperty.call(current, "y")) {
      if (typeof current.x === "string") {
        current.x = parseInt(current.x, 10)
      }
      if (typeof current.y === "string") {
        current.y = parseInt(current.y, 10)
      }
    }

    Object.values(current).forEach(convertCoordinates)
  }

  convertCoordinates(data)

  return data
}

function startConvert(): void {
  const newData = convertMapData()

  fs.writeFileSync(filepath, JSON.stringify(newData), "utf-8")
}

startConvert()
