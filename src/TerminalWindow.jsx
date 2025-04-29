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
        cursorBlink: true,
        theme: {
          background: '#fff', // Светлый фон для терминала
          foreground: '#000', // Черный текст
        }
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
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff', // Светлый фон терминала
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', // Легкая тень для визуального эффекта
        marginTop: '20px', // Отступ сверху
      }}
    />
  );
}

export default TerminalWindow;
