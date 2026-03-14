const express = require("express")//require：Node.js（服务器端运行时）的模块加载语法,把 express 这个库加载进来
const app = express() //调用 express() 得到一个“应用对象” app
const PORT = 3001//端口号。后端服务器监听 localhost:3001
app.use(express.json())//app.use(...)：给整个应用注册一个“中间件”;express.json()：一个内置中间件，用来把请求体（request body，请求体）里的 JSON 自动解析成 req.body
app.post("/api/chat", (req, res) => {
  const text = req.body?.text || ""
  console.log("收到：", text)
  res.json({
    reply: `(后端模拟回复)我收到：${text}`
  })
})

app.post("/api/chat/stream", (req, res) => {
  const text = req.body?.text || ""
  // SSE 必备响应头

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",//告诉客户端这是 SSE 流，客户端会按流方式处理
    "Cache-Control": "no-cache, no-transform",//防止中间缓存干扰实时输出
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // 避免缓冲（即便你没有 nginx（引擎）也不坏）
  });
  res.flushHeaders() //立刻把响应头发出去，让客户端尽早进入 SSE 流状态
  /*
  res.write(...)：往响应里追加内容（不会结束连接）
  data:：SSE 协议字段名，表示这条事件的数据
  \n\n：一条 SSE 消息必须用空行结束（也就是两个换行），客户端才能把它当作“完整事件”处理
  JSON.stringify({ delta: ... })：data 里放 JSON 字符串，前端好解析
  */
  res.write(`data: ${JSON.stringify({ delta: "（流开始）" })}\n\n`);
  //模拟回复：准备一个完整字符串 full（用 text 拼一句话）
  const full = `我收到：${text}。这是流式输出示例。`;
  let i = 0;
  let closed = false;
  res.on("close", () => {
    closed = true;
    console.log(">>> res closed");
    clearInterval(timer);
  });
  //用 setInterval 每 50ms 推送一个字符（模拟 token（词元））
  const timer = setInterval(() => {
    if (closed || res.writableEnded) return;
    if (i >= full.length) {
      clearInterval(timer);
      //res.json() 是一次性返回，立刻结束连接; SSE 要持续输出，所以必须用 res.write() 多次写入，并且暂时不 end()
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }
    const chunk = full.slice(i, i + 1); // 每次推 1 个字符（模拟 token）,从第 i 个位置开始截取，到第 i + 1 个位置之前结束,放到 chunk 里
    i += 1;
    console.log("push:", chunk);
    res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);

  }, 50);
  console.log(">>> timer created");
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

