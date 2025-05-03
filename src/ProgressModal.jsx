// src/ProgressModal.jsx
import React from 'react';

export default function ProgressModal({ open, total, current, onClose }) {
  if (!open) return null;
  const percent = total > 0 ? Math.round((current/total)*100) : 0;

  return (
    <div style={{
      position: 'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000
    }}>
      <div style={{
        width: '400px', background:'#fff', padding:20,
        borderRadius:8, textAlign:'center'
      }}>
        <h3>Перевод скрипта</h3>
        <div style={{
          height: '20px', width:'100%', background:'#eee', borderRadius:10,
          overflow:'hidden', marginBottom:10
        }}>
          <div style={{
            height:'100%', width:`${percent}%`,
            background:'#4caf50'
          }} />
        </div>
        <p>{current} / {total} блоков ({percent}%)</p>
        {current === total && (
          <button onClick={onClose}>Закрыть</button>
        )}
      </div>
    </div>
  );
}
