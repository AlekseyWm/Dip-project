import React, { useState, useEffect } from 'react';

export default function ProgressModal({ open, total, current, onClose }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const isDone = percent === 100;

  useEffect(() => {
    if (open) setConfirmOpen(false); // сбрасываем подтверждение при открытии
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (!isDone) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={handleClose} style={styles.closeButton} aria-label="Закрыть">×</button>
          <h3>Перевод скрипта</h3>

          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${percent}%`
            }} />
          </div>

          {isDone ? (
            <p style={{ fontWeight: '400', color: '#000' }}>Скрипт переведён!</p>
          ) : (
            <p>{current} / {total} блоков ({percent}%)</p>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div style={styles.overlay}>
          <div style={styles.confirmBox}>
            <p style={{ marginBottom: 20 }}>Вы уверены, что хотите завершить процесс интерпретации?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={styles.primaryButton} onClick={() => setConfirmOpen(false)}>Отмена</button>
              <button style={styles.secondaryButton} onClick={onClose}>Уверен</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: {
    width: '400px',
    background: '#fff',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    fontSize: '20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999'
  },
  progressBar: {
    height: '20px',
    width: '100%',
    background: '#eee',
    borderRadius: '5px',
    overflow: 'hidden',
    margin: '20px 0'
  },
  progressFill: {
    height: '100%',
    background: '#005bbb',
    transition: 'width 0.3s ease'
  },
  confirmBox: {
    width: '350px',
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'left'
  },
  primaryButton: {
    background: '#005bbb',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryButton: {
    background: '#eee',
    color: '#333',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
