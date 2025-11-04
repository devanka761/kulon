export async function copyToClipboard(plaintext: string): Promise<boolean> {
  return await navigator.clipboard
    .writeText(plaintext)
    .then(() => {
      return true
    })
    .catch((_err) => {
      // console.log(err)
      return false
    })
}
