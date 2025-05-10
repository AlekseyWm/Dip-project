import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef
} from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import './TerminalWindow.css'; // подключаем стили

const TerminalWindow = forwardRef(({ initialLog = [] }, ref) => {
  const containerRef = useRef(null);
  const termRef = useRef(null);

  useEffect(() => {
    if (!termRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        convertEol: true,
        theme: {
          background: '#ffffff',
          foreground: '#000000',
          cursor: '#000000',
        },
        scrollback: 1000,
        fontFamily: 'Consolas, monospace',
        fontSize: 14
      });

      term.open(containerRef.current);
      term.writeln('Добро пожаловать в мини-терминал!');
      term.writeln('Все логи будут выводиться здесь.');
      term.write('> ');

      initialLog.forEach(line => term.writeln(line));
      termRef.current = term;

      setTimeout(() => {
        term?.resize?.(120, 15);
      }, 100);
    }
  }, [initialLog]);

  useImperativeHandle(ref, () => ({
    writeln: (text) => {
      termRef.current?.writeln(text);
    },
    write: (text) => {
      termRef.current?.write(text);
    },
    clear: () => {
      termRef.current?.clear();
      termRef.current?.writeln('Добро пожаловать в мини-терминал!');
      termRef.current?.writeln('Все логи будут выводиться здесь.');
      termRef.current?.write('> ');
    }
  }));

  return (
    <div className="terminal-wrapper light">
      <div className="terminal-header">Терминал логов</div>
      <div className="terminal-body" ref={containerRef} />
    </div>
  );
});

export default TerminalWindow;
