import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef
} from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit'; // 💡 добавляем fitAddon
import 'xterm/css/xterm.css';
import './TerminalWindow.css';

const TerminalWindow = forwardRef(({ initialLog = [] }, ref) => {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);

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

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;

      term.open(containerRef.current);
      term.writeln('Добро пожаловать в мини-терминал!');
      term.writeln('Все логи будут выводиться здесь.');
      term.write('> ');

      initialLog.forEach(line => term.writeln(line));
      termRef.current = term;

      setTimeout(() => fitAddon.fit(), 100); // начальное подгонка размера
    }

    // ⚡ слушаем resize
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialLog]);

  useImperativeHandle(ref, () => ({
    writeln: (text) => termRef.current?.writeln(text),
    write: (text) => termRef.current?.write(text),
    clear: () => {
      termRef.current?.clear();
      termRef.current?.writeln('Добро пожаловать в мини-терминал!');
      termRef.current?.writeln('Все логи будут выводиться здесь.');
      termRef.current?.write('> ');
    },
    fit: () => fitAddonRef.current?.fit()
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    />
  );
});

export default TerminalWindow;
