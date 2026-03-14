export async function fakeChatReply(text: string): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }), //把一个 JavaScript 对象 { text } 转成 JSON 字符串
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { reply: string } //await res.json()：把后端返回内容解析成 JS 对象;as { reply: string }： TypeScript 语法，告诉对象为什么样
  return data.reply;
}
//流式回调
export async function streamChatReply(
  text: string,
  onDelta: (delta: string) => void, //每次后端流式返回一小段新内容，就调用一次这个函数，把这小段内容交给外面处理
  signal?: AbortSignal
): Promise<void> {
  //发送请求
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  //res.ok为fetch 响应对象里的一个布尔值，当HTTP 状态码是 200~299 时，res.ok 为 true；否则显示状态码
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //检查有没有响应体
  if (!res.body) throw new Error("No response body");
  /* 流式处理的核心准备工作
    1、从响应流里拿到一个“读取器”*/
  const reader = res.body.getReader();
  //后端流返回的每一块数据本质上是二进制字节，不是直接可读的字符串。所以需要用 TextDecoder("utf-8") 把字节解码成文字
  const decoder = new TextDecoder("utf-8");
  //因为服务器返回的数据块不一定正好按事件边界切开。有可能一次读到半个事件，另一半要下一次才到。需要准备一个字符串缓冲区，先把数据攒到 buffer 里，再按 SSE 的分隔规则拆
  let buffer = "";
  //开始无限循环，不断读服务器返回的数据
  let n = 0;
  while (true) {
    n++;
    const { value, done } = await reader.read();//done表示是否已经读完
    if (done) break;
    //字节解码并追加到缓冲区,{ stream: true } 的意思是：这是流式解码，可能后面还有下一段内容，解码器要保留上下文
    buffer += decoder.decode(value, { stream: true });
    // buffer = buffer.replace(/\r\n/g, "\n");
    // SSE 用 \n\n 分隔事件,split() 是字符串的方法，返回值是数组string[]
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? ""; // 先把 split 后数组最后一个元素拿出来,因为可能出现不完整事件或者空字符串
    for (const part of parts) {
      // 只处理 data: 行
      const line = part
        .split("\n")
        .find((l) => l.startsWith("data:"));
      if (!line) continue;

      const data = line.slice(5).trim(); // 去掉 "data:"
      console.log("data:", JSON.stringify(data));
      if (data === "[DONE]") return;

      // 兼容两种：纯文本 或 JSON
      if (data.startsWith("{")) {
        try {
          const obj = JSON.parse(data) as { delta?: string };
          if (obj.delta) onDelta(obj.delta);
        } catch {
          // JSON 解析失败就忽略
        }
      } else {
        // 如果后端直接发纯文本，也兼容
        onDelta(data);
      }
    }
  }
}