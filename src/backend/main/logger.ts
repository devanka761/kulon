/* eslint-disable @typescript-eslint/no-explicit-any */
class ConsoleLogger {
  private origin: string

  constructor() {
    this.origin = this._getLogOrigin().split(/[\\/]/).pop()
  }

  private _getLogOrigin() {
    let filename: any

    const _pst = Error.prepareStackTrace
    Error.prepareStackTrace = function (err, stack) {
      return stack
    }
    try {
      const err: any = new Error()
      let callerfile: string

      const currentfile: string = err.stack.shift().getFileName()

      while (err.stack.length) {
        callerfile = err.stack.shift().getFileName()

        if (currentfile !== callerfile) {
          filename = callerfile
          break
        }
      }
    } catch (_err) {
      // -
    }
    Error.prepareStackTrace = _pst

    return filename
  }

  info(content: string): void {
    console.log(`${new Date().toLocaleTimeString()} 🔆 ${content}`)
  }

  success(content: string): void {
    console.log(`${new Date().toLocaleTimeString()} ❇️ ${content}`)
  }
}

export default new ConsoleLogger()
