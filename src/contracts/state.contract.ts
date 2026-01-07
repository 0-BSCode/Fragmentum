// State Contracts
// Defines interfaces for application state management

export interface IAppState {
  floatingButton: HTMLDivElement | null;
  feedbackTimeout: ReturnType<typeof setTimeout> | null;
  selectionDebounceTimeout: ReturnType<typeof setTimeout> | null;
}

export interface IStateManager {
  get<K extends keyof IAppState>(key: K): IAppState[K];
  set<K extends keyof IAppState>(key: K, value: IAppState[K]): void;
  reset(): void;
}
