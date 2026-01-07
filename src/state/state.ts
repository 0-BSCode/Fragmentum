// State Manager
// Centralized application state management

import type { IAppState, IStateManager } from '../contracts';

const initialState: IAppState = {
  floatingButton: null,
  feedbackTimeout: null,
  selectionDebounceTimeout: null,
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
    if (state.selectionDebounceTimeout) {
      clearTimeout(state.selectionDebounceTimeout);
    }
    state = { ...initialState };
  },
};
