import db from "../data/db"
import LocalList from "../data/LocalList"
import audio from "./AudioHandler"
import { eroot, kel, qutor } from "./kel"
import waittime from "./waittime"

interface INotificationConfig {
  title: string
  description: string
}

let notificationId: number = 0

const notificationQueue: INotificationConfig[] = []

let isProcessingQueue: boolean = false

async function processQueue(): Promise<void> {
  if (notificationQueue.length === 0) {
    isProcessingQueue = false
    return
  }

  isProcessingQueue = true

  if (db.pmc) {
    await waittime(1000)
    processQueue()
    return
  }

  const achievement = notificationQueue.shift() as INotificationConfig

  const container = kel("div", "achievement-container")
  const notification = kel("div", "achievement-notification show")
  notification.id = `notification-${notificationId++}`

  let particlesHTML = ""
  for (let i = 0; i < 10; i++) {
    const randomX = Math.random() * 100
    const randomY = Math.random() * 100
    const randomOffset = (Math.random() - 0.5) * 100
    particlesHTML += `<div class="particle" style="left: ${randomX}%; top: ${randomY}%; --x-offset: ${randomOffset}px;"></div>`
  }

  let confettiHTML = ""
  const colors = ["#8e62a3", "#a395e8", "#5865f1"]
  for (let i = 0; i < 15; i++) {
    const randomX = Math.random() * 100
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    confettiHTML += `<div class="confetti" style="left: ${randomX}%; background-color: ${randomColor};"></div>`
  }

  notification.innerHTML = `<div class="achievement-icon"> <i class="fa-sharp fa-solid fa-trophy-star"></i> </div> <div class="achievement-content"> <div class="achievement-title">${achievement.title}</div> <div class="achievement-description">${achievement.description}</div> </div> <div class="particles"> ${particlesHTML} </div> ${confettiHTML}`

  container.appendChild(notification)
  eroot().append(container)
  audio.emit({ action: "play", type: "sfx", src: "text_intro", options: { id: Date.now().toString() } })

  await waittime(7000)
  closeNotification(notification.id)
  await waittime(1000)
  processQueue()
}

function closeNotification(id: string): void {
  const notification = document.getElementById(id)
  if (notification) notification.remove()

  const container = qutor(".achievement-container")
  if (container) container.remove()
}

function showAchievement(config: INotificationConfig): void {
  if (LocalList["achievement_notification_disabled"]) return
  notificationQueue.push({
    title: config.title,
    description: config.description
  })

  if (!isProcessingQueue) {
    processQueue()
  }
}

export function achievement({ title, description }: INotificationConfig): void {
  showAchievement({ title, description })
}
