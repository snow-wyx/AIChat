import { useEffect, useRef, useState } from "react"
import Composer from "./Composer/Composer"
import "./Main.css"
import { useChat } from "../../context/ChatContext"
function Main() {
  const { sessions, input, generating, setInput, createSession, selectSession, sendMessage, activeMessages, activeSessionId } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null) //用于在发送消息时将自动滚动到最新消息
  //监听messages的长度是否发生变化,在发生变化时滚回底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeMessages.length])
  //发送时，获取并渲染用户消息、助手消息，清空输入框
  return (
    <div className="message-list">
      <div className="messages">
        {activeMessages.map((m) => (
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
      <Composer value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={!input.trim() || generating} />
    </div>

  )
}

export default Main

