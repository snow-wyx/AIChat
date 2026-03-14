import { Input, Button } from 'antd';
import { ArrowUpOutlined, StopOutlined } from "@ant-design/icons";
import './Composer.css'

const { TextArea } = Input;
interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  generating: boolean;
  onStop: () => void;
}
function Composer({ value, onChange, onSend, disabled, generating, onStop }: ComposerProps) {

  return (
    <div className='composer'>
      <div className='composer-box'>
        <TextArea className='composer-textarea'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault() //取消默认行为
              onSend()
            }
          }}

          rows={3}
          placeholder="Type a message..."

        />
        {generating ? (
          <Button
            className="composer-send"
            type="primary"
            shape="circle"
            icon={<StopOutlined />}
            onClick={onStop}
          />
        ) : (
          <Button
            className="composer-send"
            type="primary"
            shape="circle"
            icon={<ArrowUpOutlined />}
            disabled={disabled}
            onClick={onSend}
          />
        )}

      </div>
    </div>
  )
}
export default Composer