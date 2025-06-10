import { useState, useEffect } from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 300; // in ms

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
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
    if (typeof nextState === "function") {
      this.state = nextState(this.state);
    } else {
      this.state = { ...this.state, ...nextState };
    }

    this.listeners.forEach((listener) => listener(this.state));
  },

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  },
};

export const toast = ({ ...props }) => {
  const id = generateId();

  const dismiss = () => {
    // Trigger fade-out animation by setting `visible: false`
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, visible: false } : t
      ),
    }));

    // Fully remove after animation delay
    setTimeout(() => {
      toastStore.setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_REMOVE_DELAY);
  };

  const update = (updateProps) =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updateProps } : t
      ),
    }));

  toastStore.setState((state) => ({
    ...state,
    toasts: [
      {
        ...props,
        id,
        dismiss,
        update,
        visible: true,
      },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  }));

  return { id, dismiss, update };
};

export function useToast() {
  const [state, setState] = useState(toastStore.getState());

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timers = [];

    state.toasts.forEach((t) => {
      if (t.duration === Infinity) return;

      const timeout = setTimeout(() => {
        t.dismiss?.();
      }, t.duration || 5000);

      timers.push(timeout);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [state.toasts]);

  return {
    toast,
    toasts: state.toasts.filter((t) => t.visible), // hide fading out
  };
}
