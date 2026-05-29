import { Game } from "../main/Game"
import { Wind } from "./_Wind"
import { Cloud } from "./_Cloud"

export type IWeather = "Wind" | "Cloud"

export class WeatherControl {
  curentWeather: IWeather = "Wind"
  game!: Game
  windEffect!: Wind
  cloudEffect!: Cloud

  switchTimer: number = 0
  timeToNextSwitch: number = 0

  isFading: boolean = false
  fadeTimer: number = 0
  fadeDuration: number = 14

  constructor() {}

  init(game: Game): void {
    this.game = game

    this.windEffect = new Wind()
    this.windEffect.init(game)

    this.cloudEffect = new Cloud()
    this.cloudEffect.init(game)

    this.resetTimer()
  }

  resetTimer(): void {
    this.switchTimer = 0
    this.timeToNextSwitch = Math.random() * 180 + 120
  }

  update(deltaTime: number): void {
    if (!this.game.map.useWeather) return

    this.switchTimer += deltaTime
    if (this.switchTimer >= this.timeToNextSwitch && !this.isFading) {
      this.isFading = true
      this.fadeTimer = 0
    }

    let activeWind = this.curentWeather === "Wind"
    let activeCloud = this.curentWeather === "Cloud"

    if (this.isFading) {
      this.fadeTimer += deltaTime
      if (this.fadeTimer >= this.fadeDuration) {
        this.isFading = false
        this.curentWeather = this.curentWeather === "Wind" ? "Cloud" : "Wind"
        this.resetTimer()
      } else {
        activeWind = true
        activeCloud = true
      }
    }

    if (activeWind && this.windEffect) {
      this.windEffect.update(deltaTime)
    }
    if (activeCloud && this.cloudEffect) {
      this.cloudEffect.update(deltaTime)
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.game.map.useWeather) return

    let windOpacity = this.curentWeather === "Wind" ? 1 : 0
    let cloudOpacity = this.curentWeather === "Cloud" ? 1 : 0

    if (this.isFading) {
      const progress = this.fadeTimer / this.fadeDuration
      if (this.curentWeather === "Wind") {
        windOpacity = 1 - progress
        cloudOpacity = progress
      } else {
        cloudOpacity = 1 - progress
        windOpacity = progress
      }
    }

    if (windOpacity > 0 && this.windEffect) {
      ctx.globalAlpha = windOpacity
      this.windEffect.draw(ctx)
      ctx.globalAlpha = 1
    }

    if (cloudOpacity > 0 && this.cloudEffect) {
      ctx.globalAlpha = cloudOpacity
      this.cloudEffect.draw(ctx)
      ctx.globalAlpha = 1
    }
  }
}
