import { Checkbox, Input } from "antd";
import { useEffect, useState } from "react";

interface FormCheckBoxProps {
  value?: string;
  onChange?: (value?: string) => void;
  text: string;
  placeholder?: string;
}

const FormCheckBox: React.FC<FormCheckBoxProps> = (props) => {
  const { value, onChange, text, placeholder } = props;
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      onChange?.(undefined);
    }
  }, [checked, onChange]);

  return (
    <div>
      <Checkbox
        checked={checked}
        onChange={() => {
          setChecked((_checked) => !_checked);
        }}
      >
        {text}
      </Checkbox>
      {checked && (
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
          }}
          style={{ margin: "10px 0px 0px 20px", width: "400px" }}
        />
      )}
    </div>
  );
};

export default FormCheckBox;
