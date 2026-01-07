// UI Contracts
// Defines interfaces for UI components

export type FeedbackType = 'success' | 'error';

export interface IButtonComponent {
  create(): void;
  show(): void;
  hide(): void;
  showSuccess(): void;
  reset(): void;
  getElement(): HTMLDivElement | null;
}

export interface IButtonPositioner {
  position(element: HTMLElement, selectionRect: DOMRect): void;
}

export interface IFeedbackComponent {
  show(message: string, type: FeedbackType): void;
  hide(): void;
}
