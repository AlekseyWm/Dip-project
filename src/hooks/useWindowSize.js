// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react';

export default function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);

  useEffect(() => {
    const handler = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}
