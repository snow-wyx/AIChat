import { useEffect, useRef, useState } from "react"
import Composer from "./Composer/Composer"
import "./Main.css"
import { useChat } from "../../context/ChatContext"
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer"
function Main() {
  const { sessions, input, generating, setInput, createSession, selectSession, sendMessage, activeMessages, activeSessionId, stopGenerating } = useChat()
  const bottomRef = useRef<HTMLDivElement | null>(null) //用于在发送消息时将自动滚动到最新消息
  const [isAtBottom, setIsAtBottom] = useState(true)
  const listRef = useRef<HTMLDivElement | null>(null)
  //监听messages的长度是否发生变化,在发生变化时滚回底部
  useEffect(() => {
    if (!isAtBottom) return
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeMessages.length, isAtBottom])
  //给 messages 容器加 onScroll 检测“是否在底部”
  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const threshold = 80;// 距离底部 80px 以内算在底部
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setIsAtBottom(atBottom)
  }


  //发送时，获取并渲染用户消息、助手消息，清空输入框
  return (
    <div className="message-list">
      <div className="messages" ref={listRef} onScroll={handleScroll}>

        {activeMessages.map((m) => (
          <div className={`msg-row ${m.role === "user" ? "is-user" : "is-assistant"}`} key={m.id} >
            <div className={`msg-bubble ${m.role === "user" ? "is-user" : "is-assistant"}`}>
              <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>{" "}
              {m.role === "assistant" ? (<MarkdownRenderer content={m.content ?? ""} />) : (<span>{m.content}</span>)}
            </div>
          </div>
        ))}
        {/*用于在发送消息时将自动滚动到最新消息*/}
        <div ref={bottomRef} />
      </div>
      {!isAtBottom && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ position: "absolute", right: 16, bottom: 120 }}
        >
          回到底部
        </button>
      )}
      <Composer value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={!input.trim() || generating} onStop={stopGenerating} generating={generating} />
    </div>

  )
}

export default Main

