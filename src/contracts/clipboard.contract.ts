// Clipboard Contracts
// Defines interfaces for clipboard operations

export interface IClipboardService {
  copy(text: string): Promise<boolean>;
}
