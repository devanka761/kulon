interface IBoardAPI {
  coor: string[]
  grid: string
}

const BOARD_SIZE = 11
const START_X = 17
const START_Y = 21
const STEP = 2

function generateBoardAPI(): IBoardAPI[] {
  const board: IBoardAPI[] = []
  for (let gridX = 0; gridX < BOARD_SIZE; gridX++) {
    for (let gridY = 0; gridY < BOARD_SIZE; gridY++) {
      const worldX = START_X + gridX * STEP
      const worldY = START_Y + gridY * STEP

      board.push({
        grid: `${gridX},${gridY}`,
        coor: [`${worldX},${worldY}`, `${worldX + 1},${worldY}`, `${worldX},${worldY + 1}`, `${worldX + 1},${worldY + 1}`]
      })
    }
  }
  return board
}

export const BoardAPI: IBoardAPI[] = generateBoardAPI()

export function getGrid(coor: string): IBoardAPI | null {
  const [worldX, worldY] = coor.split(",").map(Number)

  if (isNaN(worldX) || isNaN(worldY)) return null

  const gridX = Math.floor((worldX - START_X) / STEP)
  const gridY = Math.floor((worldY - START_Y) / STEP)
  const gridString = `${gridX},${gridY}`

  if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
    return BoardAPI.find((cell) => cell.grid === gridString) || null
  }

  return null
}

export function getByGrid(grid: string): IBoardAPI | null {
  return BoardAPI.find((board) => board.grid === grid) || null
}
