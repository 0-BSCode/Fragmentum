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

export interface IFragmentGenerator {
  generate(selection: Selection): string;
}

export interface IContextExtractor {
  extract(range: Range, prefixWords: number, suffixWords: number): SelectionContext;
}

export interface IFragmentEncoder {
  encode(text: string): string;
}

export interface IFragmentBuilder {
  build(parts: FragmentParts): string;
}
