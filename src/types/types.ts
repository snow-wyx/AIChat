export type Role = "user" | "assistant"

export interface Message {
  id: string,
  createdAt: number,
  role: Role,
  content: string
}

export interface Session {
  id: string,
  createdAt: number,
  messages: Message[],
  title: string
}