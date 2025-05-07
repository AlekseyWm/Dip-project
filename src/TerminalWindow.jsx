// TerminalWindow.jsx
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

function TerminalWindow({ terminalRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) {
      terminalRef.current = new Terminal({
        rows: 10,
        cols: 80,
        cursorBlink: true,
        theme: { background: '#fff', foreground: '#000' }
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
        backgroundColor: '#fff',
        marginTop: '20px',
      }}
    />
  );
}

export default TerminalWindow;
