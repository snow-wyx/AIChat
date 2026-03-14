import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import hljs from "highlight.js"

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}//使用 remark-gfm 插件来启用对 GitHub 风格的 Markdown 扩展支持
      components={{ //属性是一个对象，允许我们为 Markdown 内容的不同部分自定义渲染方式
        code({ inline, className, children, ...props }: any) {//这是一个自定义渲染 code 元素的方式，code 用来渲染 Markdown 中的代码块,参数是解构 code 元素的属性
          const match = /language-(\w+)/.exec(className || "")//这行用正则表达式 language-(\w+) 从 className 中提取语言类型
          const lang = match?.[1]
          //如果是内联代码，它直接返回一个 code 元素
          if (inline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
          //这里将代码文本 children 转换为字符串（如果它不是字符串的话），并使用 .replace(/\n$/, "") 去除尾部的换行符
          const raw = String(children).replace(/\n$/, "")
          //使用 highlight.js 来对代码进行语法高亮
          const highlighted = lang && hljs.getLanguage(lang)
            ? hljs.highlight(raw, { language: lang }).value
            : hljs.highlightAuto(raw).value //如果语言无效（如没有指定或无法识别），则使用 hljs.highlightAuto(raw) 来自动识别并高亮代码

          return (
            //如果是块级代码（不是内联代码），则返回一个包含高亮代码的 pre 和 code 元素
            <pre>
              <code
                className={className}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}




