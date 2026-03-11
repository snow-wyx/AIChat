import { createContext, useContext, useState } from "react";
import type { Message, Session } from "../types/types.ts";
import { uid } from "../utils/uid.ts"
import { fakeChatReply } from "../services/fakeChat.ts"
interface ChatContextValue {
  sessions: Session[],
  activeSessionId: string,
  activeMessages: Message[],
  input: string,
  generating: boolean,
  setInput: (text: string) => void,
  sendMessage: (msg: string) => Promise<void>,
  createSession: () => void,
  selectSession: (id: string) => void
}
const ChatContext = createContext<ChatContextValue | null>(null)
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const sessionId = uid()
    return [
      {
        id: sessionId,
        createdAt: Date.now(),
        messages: [],
        title: "new chat"
      }
    ]
  }
  )
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id)

  const activeMessages = sessions.find((s) => s.id === activeSessionId)?.messages ?? [];
  /*等价于const currentSession = sessions.find((s) => s.id === activeSessionId)
    const messages = currentSession ? currentSession.messages : []  */
  const [input, setInput] = useState("")
  const [generating, setGenerating] = useState(false)
  const sendMessage = async (msg: string) => {
    const trimmed = msg.trim()
    if (!trimmed || generating) return
    setGenerating(true)
    const userMsg: Message = {
      id: uid(),
      createdAt: Date.now(),
      role: "user",
      content: trimmed
    }
    const assistantId = uid();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "", // 先占位
      createdAt: Date.now(),
    };
    setSessions(prev =>
      prev.map((s) => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg, assistantMsg] } : s)
    )
    setInput("")
    //模拟异步回复
    const reply = await fakeChatReply(trimmed)
    setSessions(prev =>
      prev.map((s) => s.id === activeSessionId ? { ...s, messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)) } : s)
    )
    try {
      const reply = await fakeChatReply(trimmed)
      setSessions(prev =>
        prev.map((s) => s.id === activeSessionId ? { ...s, messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)) } : s)
      )
    } catch (e) {
      setSessions(prev =>
        prev.map((s) => s.id === activeSessionId ? { ...s, messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: "出错了，请重试！" } : m)) } : s)
      )
    }
    //   finally {
    //   setGenerating(false);
    // }
    //新增会话处理

  }
  const createSession = () => {
    const id = uid();
    const newSession: Session = {
      id,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(id)
  }
  //选择会话处理
  const selectSession = (id: string) => {
    setActiveSessionId(id);
  }
  return (
    <ChatContext.Provider value={{ sessions, input, generating, setInput, createSession, selectSession, sendMessage, activeMessages, activeSessionId }}>
      {children}
    </ChatContext.Provider>
  )
}
export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat必须在ChatProvider内使用")
  return ctx
}



