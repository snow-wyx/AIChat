const LS_SESSIONS_KEY = "aichat:sessions"
const LS_ACTIVE_ID_KEY = "aichat:activeSessionId"
import { createContext, useContext, useState, useEffect } from "react"
import type { Message, Session } from "../types/types.ts"
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
    //判断本地是否有会话，有从本地调取，没用则默认一个新会话
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Session[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // 解析失败就走默认
      }
    }
    const firstId = uid();
    return [
      {
        id: firstId,
        title: "New Chat",
        createdAt: Date.now(),
        messages: [],
      },
    ];
  })


  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem(LS_ACTIVE_ID_KEY);
    if (saved) return saved;
    return sessions[0]?.id ?? ""

  })
  //localStorage.setItem(key, value),因为 sessions 是数组，不是字符串，不能直接存,先把它转成 JSON 字符串
  useEffect(() => {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(LS_ACTIVE_ID_KEY, activeSessionId);
  }, [activeSessionId]);
  //防止 activeSessionId 指向不存在的会话
  useEffect(() => {
    if (!sessions.length) return;
    const exists = sessions.some((s) => s.id === activeSessionId);
    if (!exists) setActiveSessionId(sessions[0].id);
  }, [sessions, activeSessionId]);

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
    finally {
      setGenerating(false);
    }
    //新增会话处理

  }
  const createSession = () => {
    const id = uid();
    const newSession: Session = {
      id,
      title: `New Chat ${sessions.length + 1}`,
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



