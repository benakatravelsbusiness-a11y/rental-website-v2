import { useState, useEffect } from 'react';

let toasts = [];
let setToastsExternal = null;

export function showToast(message, type = 'success') {
  const id = Date.now();
  toasts = [...toasts, { id, message, type }];
  if (setToastsExternal) setToastsExternal([...toasts]);
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    if (setToastsExternal) setToastsExternal([...toasts]);
  }, 3500);
}

export default function Toast() {
  const [items, setItems] = useState([]);
  useEffect(() => { setToastsExternal = setItems; }, []);

  return (
    <div className="toast-container">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? '✅' : '❌'} {t.message}
        </div>
      ))}
    </div>
  );
}
