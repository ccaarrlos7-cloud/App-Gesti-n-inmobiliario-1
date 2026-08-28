const fs = require('fs');

const file = 'src/components/CalculatorView.tsx';
let content = fs.readFileSync(file, 'utf8');

const FormattedInputCode = `
function FormattedInput({ value, onChange, className, step = "1", ...props }: any) {
  const [isFocused, setIsFocused] = React.useState(false);
  
  let displayValue: string | number = '';
  if (isFocused) {
    displayValue = value || '';
  } else {
    displayValue = value ? formatNumber(value, step === "any" || step.includes(".") ? 2 : 0) : '';
  }

  return (
    <input
      {...props}
      type={isFocused ? "number" : "text"}
      step={step}
      className={className}
      value={displayValue}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export default function CalculatorView() {`;

content = content.replace('export default function CalculatorView() {', FormattedInputCode);

// Regex to replace all `<input ... onChange={e => setXYZ(Number(e.target.value))} />`
// Wait, the mortgage inputs are multi-line. Let's check them.
