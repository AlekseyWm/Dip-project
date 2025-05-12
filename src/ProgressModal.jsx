import React, { useEffect, useState } from 'react';

/**
 * props:
 * ───────────────────────────────────────────────
 * open      : boolean
 * total     : number
 * current   : number
 * phase     : "translate" | "syntax" | "done"
 * fileName  : string
 * onClose   : () => void
 */
export default function ProgressModal({
  open,
  total,
  current,
  phase = 'translate',
  fileName,
  onClose
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const percent = total ? Math.round((current / total) * 100) : 0;
  const isDone = phase === 'done';

  useEffect(() => {
    if (open) setConfirmOpen(false);
  }, [open]);

  if (!open) return null;

  const headerText = {
    translate: 'Перевод скрипта',
    syntax:    'Проверка синтаксиса',
    done:      'Перевод скрипта'
  }[phase];

  const infoText = {
    translate: `${current} / ${total} блоков (${percent}%)`,
    syntax:    'Идёт проверка…',
    done:      'Скрипт переведён и проверен!'
  }[phase];

  const handleCloseClick = () => {
    if (isDone) onClose();
    else        setConfirmOpen(true);
  };

  const handleConfirmStop = () => {
    onClose(); // Закрыть модалку и остановить SSE

    fetch('http://localhost:9999/api/application/stop_translation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ file_name: fileName })
    }).catch(err =>
      console.error('Не удалось отправить stop_translation:', err)
    );
  };

  return (
    <>
      {/* основная модалка */}
      <div style={styles.overlay}>
        <div style={styles.modal}>
          {isDone && (
            <button
              aria-label="Закрыть"
              onClick={handleCloseClick}
              style={styles.closeButton}
            >
              ×
            </button>
          )}

          <h3 style={styles.header}>{headerText}</h3>

          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                background: isDone ? '#28a745' : '#005bbb',
                width: isDone ? '100%' : `${percent}%`
              }}
            />
          </div>

          <p style={styles.info}>{infoText}</p>
        </div>
      </div>

      {/* подтверждение остановки */}
      {confirmOpen && (
        <div style={styles.overlay}>
          <div style={styles.confirmBox}>
            <p style={{ marginBottom: 20 }}>Вы уверены, что хотите прервать перевод?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={styles.primaryButton} onClick={() => setConfirmOpen(false)}>
                Отмена
              </button>
              <button style={styles.secondaryButton} onClick={handleConfirmStop}>
                Уверен
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* inline styles */
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: 400,
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    textAlign: 'center',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    fontSize: 20,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999'
  },
  header: {
    margin: 0,
    fontWeight: 300
  },
  info: {
    fontWeight: 300
  },
  progressBar: {
    height: 20,
    width: '100%',
    background: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    margin: '20px 0'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease, background 0.3s ease'
  },
  confirmBox: {
    width: 350,
    background: '#fff',
    borderRadius: 8,
    padding: 20,
    textAlign: 'left'
  },
  primaryButton: {
    background: '#005bbb',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 4,
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryButton: {
    background: '#eee',
    color: '#333',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 4,
    cursor: 'pointer'
  }
};
