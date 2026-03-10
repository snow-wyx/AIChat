export function fakeChatReply(text: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`（模拟回复）我收到：${text}`)
    }, 300)
  })
}
