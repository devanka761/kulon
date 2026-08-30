type UserChoice = Promise<{
  outcome: "accepted" | "dismissed"
  platform: string
}>

declare interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: UserChoice
  prompt(): Promise<UserChoice>
}
declare interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}
