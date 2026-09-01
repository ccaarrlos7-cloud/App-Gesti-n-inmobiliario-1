import React, { useState, useEffect } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | '';
  onChange: (val: number | '') => void;
  decimals?: number;
}

export default function FormattedNumberInput({ value, onChange, decimals = 2, ...props }: Props) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === '' || value === undefined || value === null || isNaN(value as number)) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatValue(value as number, decimals));
      }
    }
  }, [value, decimals, isFocused]);

  const parseNumber = (val: string) => {
    if (!val) return '';
    // Eliminar puntos (separadores de miles)
    let cleanStr = val.replace(/\./g, '');
    // Cambiar coma por punto (separador decimal)
    cleanStr = cleanStr.replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? '' : num;
  };

  const formatValue = (val: number, dec: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: dec,
      useGrouping: true
    }).format(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Permitir solo números, comas y puntos
    inputValue = inputValue.replace(/[^0-9.,]/g, '');
    
    // Asegurar que solo haya una coma
    const parts = inputValue.split(',');
    if (parts.length > 2) {
      inputValue = parts[0] + ',' + parts.slice(1).join('');
    }

    setDisplayValue(inputValue);
    
    const num = parseNumber(inputValue);
    
    if (inputValue === '') {
      onChange('');
    } else if (num !== '') {
      const parsedNum = num as number;
      if (parsedNum >= 0) {
        onChange(parsedNum);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (value !== '' && value !== undefined && value !== null) {
      setDisplayValue(formatValue(value as number, decimals));
    }
    if (props.onBlur) props.onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...props}
    />
  );
}
