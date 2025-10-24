const MINIGAME_LOADERS = {
  egghunt: () =>
    import(
      /* webpackChunkName: "egghunt/main" */
      "../MiniGames/_EggHunt/EggHunt"
    )
}

export async function loadMiniGame(id: string) {
  const loader = MINIGAME_LOADERS[id as keyof typeof MINIGAME_LOADERS]
  if (!loader) throw new Error(`Unknown minigame: ${id}`)
  const module = await loader()
  return module
}
