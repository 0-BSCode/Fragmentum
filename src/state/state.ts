// State Manager
// Centralized application state management

import type { IAppState, IStateManager } from "@/contracts";

const initialState: IAppState = {
  toastElement: null,
  feedbackTimeout: null,
};

let state: IAppState = { ...initialState };

export const stateManager: IStateManager = {
  get<K extends keyof IAppState>(key: K): IAppState[K] {
    return state[key];
  },

  set<K extends keyof IAppState>(key: K, value: IAppState[K]): void {
    state[key] = value;
  },

  reset(): void {
    if (state.feedbackTimeout) {
      clearTimeout(state.feedbackTimeout);
    }
    state = { ...initialState };
  },
};
