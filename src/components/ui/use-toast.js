import { useEffect, useState } from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 300;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

const toastStore = {
  state: {
    toasts: [],
  },
  listeners: [],

  getState() {
    return this.state;
  },

  setState(nextState) {
    const state = typeof nextState === "function" ? nextState(this.state) : { ...this.state, ...nextState };
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  },

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  },
};

const createToast = (props) => {
  const id = generateId();

  const dismiss = () => {
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, visible: false } : t
      ),
    }));

    setTimeout(() => {
      toastStore.setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_REMOVE_DELAY);
  };

  const update = (updates) =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));

  toastStore.setState((state) => ({
    ...state,
    toasts: [
      {
        ...props,
        id,
        visible: true,
        dismiss,
        update,
      },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  }));

  return { id, dismiss, update };
};

export const useToast = () => {
  const [state, setState] = useState(toastStore.getState());

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timers = state.toasts.map((toast) => {
      if (toast.duration === Infinity) return null;

      return setTimeout(() => {
        toast.dismiss?.();
      }, toast.duration || 5000);
    });

    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [state.toasts]);

  const toast = {
    success: ({ title = "Success", description = "", duration }) =>
      createToast({ title, description, duration, variant: "default" }),
    error: ({ title = "Error", description = "", duration }) =>
      createToast({ title, description, duration, variant: "destructive" }),
    custom: (config) => createToast(config),
  };

  return {
    toast,
    toasts: state.toasts.filter((t) => t.visible),
  };
};
