import { toast, type ToastOptions } from "react-hot-toast";

const baseOptions: ToastOptions = {
  duration: 3600,
  style: {
    borderRadius: "12px",
    border: "1px solid #d5e6f5",
    background: "linear-gradient(135deg, #0b132b 0%, #1c2541 100%)",
    color: "#f1f7ff",
    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.25)",
    padding: "12px 14px",
    fontSize: "13px",
    fontWeight: "500",
  },
};

export const hrToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      ...baseOptions,
      iconTheme: {
        primary: "#00b4d8",
        secondary: "#f1f7ff",
      },
      ...options,
    }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      ...baseOptions,
      iconTheme: {
        primary: "#ef4444",
        secondary: "#fff1f2",
      },
      ...options,
    }),

  info: (message: string, options?: ToastOptions) =>
    toast(message, {
      ...baseOptions,
      icon: "ℹ",
      ...options,
    }),

  warning: (message: string, options?: ToastOptions) =>
    toast(message, {
      ...baseOptions,
      icon: "⚠",
      ...options,
    }),
};
