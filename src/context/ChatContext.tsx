const LS_SESSIONS_KEY = "aichat:sessions"
const LS_ACTIVE_ID_KEY = "aichat:activeSessionId"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import type { Message, Session } from "../types/types.ts"
import { uid } from "../utils/uid.ts"
import { streamChatReply } from "../services/fakeChat.ts"
interface ChatContextValue {
  sessions: Session[],
  activeSessionId: string,
  activeMessages: Message[],
  input: string,
  generating: boolean,
  setInput: (text: string) => void,
  sendMessage: (msg: string) => Promise<void>,
  createSession: () => void,
  selectSession: (id: string) => void,
  stopGenerating: () => void
}
const ChatContext = createContext<ChatContextValue | null>(null)
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const abortRef = useRef<AbortController | null>(null);
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
    let renderBuffer = ""
    let flushTimer: number | null = null
    const controller = new AbortController()
    abortRef.current = controller
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
    //渲染节流 不每次都渲染
    const flush = () => {
      if (!renderBuffer) return

      const chunk = renderBuffer
      renderBuffer = ""

      setSessions((prev) =>
        prev.map((s) =>
          s.id !== activeSessionId
            ? s
            : {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantId ? { ...m, content: (m.content ?? "") + chunk } : m
              ),
            }
        )
      )
    }
    const startFlush = () => {
      if (flushTimer != null) return
      flushTimer = window.setInterval(flush, 50)
    }
    const stopFlush = () => {
      if (flushTimer != null) {
        window.clearInterval(flushTimer)
        flushTimer = null
      }
      flush() // streamChatReply 结束（await 返回）并不保证“刚好卡在一次 flush 之后,所以把最后剩余的一次性刷出去
    }
    //模拟异步回复
    try {
      await streamChatReply(trimmed, (delta) => {
        renderBuffer += delta
        startFlush()
      }, controller.signal)
      stopFlush()
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // Stop:保留已生成内容
      } else {
        setSessions(prev =>
          prev.map((s) => s.id === activeSessionId ? { ...s, messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: "出错了，请重试！" } : m)) } : s)
        )
      }
    }
    finally {
      setGenerating(false)
      abortRef.current = null
      stopFlush()
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
  //终止生成
  const stopGenerating = () => {
    abortRef.current?.abort()
  }
  return (
    <ChatContext.Provider value={{ sessions, input, generating, setInput, createSession, selectSession, sendMessage, activeMessages, activeSessionId, stopGenerating }}>
      {children}
    </ChatContext.Provider>
  )
}
export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat必须在ChatProvider内使用")
  return ctx
}



