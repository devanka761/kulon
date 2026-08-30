import SaveList from "../data/SaveList"

export const StateManager = {
  add: (state: string, value: boolean | string): void => {
    SaveList[state] = value
  },
  remove: (state: string): void => {
    SaveList[state] = false
    delete SaveList[state]
  }
}
