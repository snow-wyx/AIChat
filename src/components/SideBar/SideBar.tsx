
import { useChat } from "../../context/ChatContext"


function SideBar() {
  const { sessions, activeSessionId, createSession, selectSession } = useChat()
  return (
    <div>
      {/* 创建新会话*/}
      <button onClick={createSession}>New Chat</button>
      {/* 渲染会话列表*/}
      <div className="session-list">
        {
          sessions.map((s) => (
            <div
              key={s.id}
              className={s.id === activeSessionId ? "session-item active" : "session-item"}
              onClick={() => selectSession(s.id)}
            >
              {s.title}
            </div>
          ))
        }
      </div>
      <div className="sidebar">sidebar: {sessions.length}</div>
    </div>

  )
}

export default SideBar


