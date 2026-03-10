import { useEffect, useRef, useState } from "react"
import Composer from "./Composer/Composer"
import type { Message } from "../../types/types"
import { uid } from "../../utils/uid"
import "./Main.css"
import { fakeChatReply } from "../../services/fakeChat"
function Main() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [generating, setGenerating] = useState(false);//防止模型还没回复时重复发送
  const bottomRef = useRef<HTMLDivElement | null>(null) //用于在发送消息时将自动滚动到最新消息
  //监听messages的长度是否发生变化,在发生变化时滚回底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])
  //发送时，获取并渲染用户消息、助手消息，清空输入框
  const handleSend = async () => {
    const text = input.trim()
    if (!text || generating) return
    setGenerating(true)
    const userMsg: Message = {
      id: uid(),
      createdAt: Date.now(),
      role: "user",
      content: text
    }
    const assistantId = uid();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "", // 先占位
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput("")
    //模拟异步回复
    try {
      const reply = await fakeChatReply(text);

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m))
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "出错了，请重试" } : m
        )
      );
    } finally {
      setGenerating(false);
    }

    //return渲染message，Message+Composer

  }

  return (
    <div className="message-list">
      <div className="messages">

        {messages.map((m) => (
          <div className={`msg-row ${m.role === "user" ? "is-user" : "is-assistant"}`} key={m.id} >
            <div className={`msg-bubble ${m.role === "user" ? "is-user" : "is-assistant"}`}>
              <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>{" "}
              <span>{m.content || (m.role === "assistant" ? "..." : "")}</span>
            </div>
          </div>

        ))}
        {/*用于在发送消息时将自动滚动到最新消息*/}
        <div ref={bottomRef} />


      </div>
      <Composer value={input} onChange={setInput} onSend={handleSend} disabled={!input.trim() || generating} />
    </div>

  )
}

export default Main

