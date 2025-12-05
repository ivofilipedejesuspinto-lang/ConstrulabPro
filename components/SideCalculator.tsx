
import React, { useState } from 'react';
import { Calculator, Delete, Equal, Eraser } from 'lucide-react';

export const SideCalculator: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [lastWasResult, setLastWasResult] = useState(false);

  const ops = ['/', '*', '+', '-', '.'];

  const update = (value: string) => {
    if (
      (ops.includes(value) && input === '') ||
      (ops.includes(value) && ops.includes(input.slice(-1)))
    ) {
      return;
    }

    if (lastWasResult && !ops.includes(value)) {
        setInput(value);
        setLastWasResult(false);
        return;
    }
    
    if (lastWasResult && ops.includes(value)) {
        setLastWasResult(false);
    }

    setInput(input + value);
    
    // Auto-calculate for preview if it's not an operator
    if (!ops.includes(value)) {
      try {
        // eslint-disable-next-line no-new-func
        const res = new Function('return ' + input + value)();
        setResult(res.toString());
      } catch (e) {
        // Ignore incomplete expressions
      }
    }
  };

  const calculate = () => {
    if (input === '') return;
    try {
      // eslint-disable-next-line no-new-func
      const res = new Function('return ' + input)();
      setInput(res.toString());
      setResult('');
      setLastWasResult(true);
    } catch (e) {
      setInput('Erro');
      setLastWasResult(true);
    }
  };

  const deleteLast = () => {
    if (input === '') return;
    const value = input.slice(0, -1);
    setInput(value);
    setResult('');
  };

  const clear = () => {
    setInput('');
    setResult('');
    setLastWasResult(false);
  };

  const btnClass = "h-10 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center shadow-sm";
  const numBtn = `${btnClass} bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700`;
  const opBtn = `${btnClass} bg-blue-950/50 text-blue-400 hover:bg-blue-900/50 border border-blue-900/30`;
  const actionBtn = `${btnClass} bg-slate-800 text-red-400 hover:bg-slate-700 border border-slate-700`;
  const equalBtn = `${btnClass} bg-amber-600 text-white hover:bg-amber-500 col-span-2 shadow-lg shadow-amber-900/20`;

  return (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
        <Calculator size={20} className="text-indigo-400" /> Calculadora
      </h3>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 text-right">
        <div className="text-xs text-slate-500 h-4 mb-1 font-mono">{result ? `= ${result}` : ''}</div>
        <div className="text-2xl text-white font-mono font-bold overflow-x-auto custom-scrollbar whitespace-nowrap">
          {input || '0'}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className={actionBtn}><Eraser size={18}/></button>
        <button onClick={deleteLast} className={actionBtn}><Delete size={18}/></button>
        <button onClick={() => update('/')} className={opBtn}>÷</button>
        <button onClick={() => update('*')} className={opBtn}>×</button>

        <button onClick={() => update('7')} className={numBtn}>7</button>
        <button onClick={() => update('8')} className={numBtn}>8</button>
        <button onClick={() => update('9')} className={numBtn}>9</button>
        <button onClick={() => update('-')} className={opBtn}>-</button>

        <button onClick={() => update('4')} className={numBtn}>4</button>
        <button onClick={() => update('5')} className={numBtn}>5</button>
        <button onClick={() => update('6')} className={numBtn}>6</button>
        <button onClick={() => update('+')} className={opBtn}>+</button>

        <button onClick={() => update('1')} className={numBtn}>1</button>
        <button onClick={() => update('2')} className={numBtn}>2</button>
        <button onClick={() => update('3')} className={numBtn}>3</button>
        <button onClick={calculate} className={equalBtn}><Equal size={20}/></button>

        <button onClick={() => update('0')} className={`${numBtn} col-span-2`}>0</button>
        <button onClick={() => update('.')} className={numBtn}>.</button>
      </div>
    </div>
  );
};
