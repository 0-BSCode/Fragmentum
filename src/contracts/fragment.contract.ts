// Fragment Generation Contracts
// Defines interfaces for text fragment URL generation

export interface FragmentParts {
  prefix?: string;
  textStart: string;
  textEnd?: string;
  suffix?: string;
}

export interface SelectionContext {
  prefix: string;
  suffix: string;
}
