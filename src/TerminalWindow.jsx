// src/TerminalWindow.jsx
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

/**
 * @param {Object} props
 * @param {React.MutableRefObject<Terminal|null>} props.terminalRef
 */
function TerminalWindow({ terminalRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Если терминал ещё не создан, создаём и настраиваем
    if (!terminalRef.current) {
      terminalRef.current = new Terminal({
        rows: 10,
        cols: 80,
        cursorBlink: true
      });
      terminalRef.current.open(containerRef.current);

      terminalRef.current.writeln('Добро пожаловать в мини-терминал!');
      terminalRef.current.writeln('Все логи будут выводиться здесь.');
      terminalRef.current.write('> ');
    }
  }, [terminalRef]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '200px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        overflow: 'hidden',
      }}
    />
  );
}

export default TerminalWindow;
