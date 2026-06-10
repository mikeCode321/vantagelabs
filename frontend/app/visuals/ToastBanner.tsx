
import "./styles/ToastBanner.css"

export default function ToastBanner({ toasts, setToasts }) {
  
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="toast-banner-wrapper">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-item-${toast.action}`}>
          <span className="toast-icon">✓</span>

          <span className="toast-message">{toast.message}</span>

          <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}