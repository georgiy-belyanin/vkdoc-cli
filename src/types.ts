/* eslint-disable @typescript-eslint/no-explicit-any */

interface Emph {
  t: 'Emph';
  c: PandocInline[];
}

interface Str {
  t: 'Str';
  c: string;
}

interface Strong {
  t: 'Strong';
  c: PandocInline[];
}

interface Strikeout {
  t: 'Strikeout';
  c: PandocInline[];
}

interface Superscript {
  t: 'Superscript';
  c: [PandocInline[], PandocInline[]];
}

interface Subscript {
  t: 'Subscript';
  c: [PandocInline[], PandocInline[]];
}

interface SmallCaps {
  t: 'SmallCaps';
  c: PandocInline[];
}

interface Quoted {
  t: 'Quoted';
  c: ['SingleQuote' | 'DoubleQuote', PandocInline[]];
}

interface Cite {
  t: 'Cite';
  c: [any[], PandocInline[]];
}

interface Code {
  t: 'Code';
  c: [[string, string[], any[]], string];
}

interface Space {
  t: 'Space';
}

interface SoftBreak {
  t: 'SoftBreak';
}

interface LineBreak {
  t: 'LineBreak';
}

interface Math {
  t: 'Math';
  c: ['InlineMath' | 'DisplayMath', string];
}

interface RawInline {
  t: 'RawInline';
  c: [string, string];
}

interface Link {
  t: 'Link';
  c: [any[], PandocInline[], [string, string]];
}

interface Image {
  t: 'Image';
  c: [any[], PandocInline[], [string, string]];
}

interface Note {
  t: 'Note';
  c: any[];
}

interface Para {
  t: 'Para';
  c: PandocInline[];
}

interface Plain {
  t: 'Plain';
  c: PandocInline[];
}

interface BlockQuote {
  t: 'BlockQuote';
  c: PandocBlock[];
}

interface OrderedList {
  t: 'OrderedList';
  c: [
    [
      number,
      (
        | 'DefaultStyle'
        | 'Example'
        | 'Decimal'
        | 'LowerRoman'
        | 'UpperRoman'
        | 'LowerAlpha'
        | 'UpperAlpha'
      ),
      number,
    ],
    PandocBlock[][],
  ];
}

interface BulletList {
  t: 'BulletList';
  c: PandocBlock[][];
}

interface DefinitionList {
  t: 'DefinitionList';
  c: [any[], PandocBlock[][]][];
}

interface Header {
  t: 'Header';
  c: [number, [string, string[], any[]], PandocInline[]];
}

interface HorizontalRule {
  t: 'HorizontalRule';
  c: undefined;
}

interface CodeBlock {
  t: 'CodeBlock';
  c: [[string, string[], any[]], string];
}

interface RawBlock {
  t: 'RawBlock';
  c: [string, string];
}

interface Div {
  t: 'Div';
  c: [any[], PandocBlock[]];
}

interface Null {
  t: 'Null';
  c: undefined;
}

export type PandocInline =
  | Emph
  | Str
  | Strong
  | Strikeout
  | Superscript
  | Subscript
  | SmallCaps
  | Quoted
  | Cite
  | Code
  | Space
  | SoftBreak
  | LineBreak
  | Math
  | RawInline
  | Link
  | Image;

export type PandocBlock =
  | Note
  | Para
  | Plain
  | BlockQuote
  | OrderedList
  | BulletList
  | DefinitionList
  | Header
  | HorizontalRule
  | CodeBlock
  | RawBlock
  | Div
  | Null;

interface PandocMeta {
  [key: string]: PandocInline | PandocBlock | { t: string; c: any };
}

export interface PandocDocument {
  meta: PandocMeta;
  blocks: PandocBlock[];
}
