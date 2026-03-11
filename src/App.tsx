import { useState } from 'react'
import SideBar from './components/SideBar/SideBar'
import Main from './components/Main/Main'
import './App.css'
import { ChatProvider } from './context/ChatContext'

function App() {
  const [count, setCount] = useState(0)
  return (
    <ChatProvider>
      <div className='app'>
        <div className='sidebar'>
          <SideBar />
        </div>
        <div className='main'>
          <Main />
        </div>
      </div>
    </ChatProvider>
  )
}
export default App
