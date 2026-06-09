import { useEffect, useState } from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  /** Allow decimal point (e.g. 1.2, 0.7). Default true. */
  allowDecimal?: boolean;
  min?: number;
  /** Value used when the field is cleared on blur. Default 0. */
  emptyValue?: number;
}

function isValidDraft(raw: string, allowDecimal: boolean): boolean {
  if (raw === '') return true;
  return allowDecimal ? /^\d*\.?\d*$/.test(raw) : /^\d+$/.test(raw);
}

function parseDraft(raw: string): number | null {
  if (raw === '' || raw === '.') return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Text-based numeric field that allows backspace and in-progress decimals (0., 1.2).
 * Avoids `type="number"` + immediate `Number()` coercion bugs.
 */
export function NumericInput({
  value,
  onChange,
  className,
  placeholder = '0',
  allowDecimal = true,
  min = 0,
  emptyValue = 0,
}: NumericInputProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const showEmpty = value === 0 && emptyValue === 0;

  useEffect(() => {
    if (!focused) {
      setText(showEmpty ? '' : formatDisplay(value));
    }
  }, [value, focused, showEmpty]);

  const handleFocus = () => {
    setFocused(true);
    setText(showEmpty ? '' : formatDisplay(value));
  };

  const handleChange = (raw: string) => {
    if (!isValidDraft(raw, allowDecimal)) return;
    setText(raw);
    const parsed = parseDraft(raw);
    if (parsed != null) {
      onChange(Math.max(min, parsed));
    } else if (raw === '') {
      onChange(emptyValue);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseDraft(text);
    if (parsed == null || text === '') {
      onChange(emptyValue);
      setText(emptyValue === 0 ? '' : formatDisplay(emptyValue));
      return;
    }
    const clamped = Math.max(min, parsed);
    onChange(clamped);
    setText(clamped === 0 ? '' : formatDisplay(clamped));
  };

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      autoComplete="off"
      value={
        focused ? text : value === 0 && emptyValue === 0 ? '' : formatDisplay(value)
      }
      onFocus={handleFocus}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
}

function formatDisplay(n: number): string {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
