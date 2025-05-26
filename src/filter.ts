import { PandocDocument, PandocBlock, PandocInline } from './types';

export const Rst = {
  // Convert info/warning blocks to the ones specific to vkdocs.
  convertBlocks(doc: PandocDocument): PandocDocument {
    return this.walkBlock(doc, (obj) => {
      if (obj.t !== 'Div') {
        return obj;
      }

      const kind = obj.c?.[0]?.[1]?.[0];

      const map: { [key: string]: string } = {
        note: 'info',
        important: 'warning',
        admonition: 'info',
      };

      const newKind = map[kind];

      if (!newKind) {
        return obj;
      }

      const content = obj.c?.[1];
      let processedContent;
      // Check if first element is a title div
      if (
        content?.[0]?.t === 'Div' &&
        content?.[0]?.c?.[0]?.[1]?.[0] === 'title'
      ) {
        processedContent = content.slice(1);
      } else {
        processedContent = content;
      }

      return {
        t: 'Div',
        c: [[newKind, [], []], processedContent],
      };
    });
  },

  // Convert RST literalincludes to VK Doc includes.
  convertIncludes(doc: PandocDocument): PandocDocument {
    return this.walkBlock(doc, (obj) => {
      const type = obj.t;

      if (type === 'Div') {
        const kind = obj.c?.[0]?.[1]?.[0];

        if (kind === 'literalinclude') {
          const lang = obj.c?.[0]?.[2]?.[0]?.[1];
          const pathToFile = obj.c?.[1]?.[0]?.c?.[0]?.c;

          return {
            t: 'CodeBlock',
            c: [['', [lang], []], `{include(${pathToFile})}`],
          };
        } else {
          return obj;
        }
      } else if (type === 'BlockQuote' && obj.c && obj.c.length === 1) {
        const child = obj.c[0];
        if (child?.t === 'CodeBlock') {
          return child;
        } else {
          return obj;
        }
      } else {
        return obj;
      }
    });
  },

  // Convert RST refs to markdown refs.
  transformCodeWithRef(data: PandocDocument): PandocDocument {
    return this.walkInline(data, (obj) => {
      if (
        obj.t === 'Code' &&
        obj.c?.[0]?.[2]?.[0]?.[1] === 'ref' &&
        obj.c?.[1]
      ) {
        const link = obj.c[1];
        const splits = link.split('<');
        const refText = splits[0].replace(/\s*$/, ''); // Remove trailing whitespace

        if (splits.length > 1) {
          const refLink = splits[1].replace(/>.*/, ''); // Remove everything after >
          return {
            t: 'Link',
            c: [['', [], []], [{ t: 'Str', c: refText }], [refLink, '']],
          };
        } else {
          return {
            t: 'Link',
            c: [['', [], []], [{ t: 'Str', c: refText }], [refText, '']],
          };
        }
      }
      return obj;
    });
  },

  transformImageElements(doc: PandocDocument): PandocDocument {
    return this.walkInline(doc, (obj) => {
      if (obj.t !== 'Image') {
        return obj;
      }
      const newObj = { ...obj };
      if (newObj.c && newObj.c[0]) {
        newObj.c[0][1] = [];
        newObj.c[0][2] = [];
      }
      return newObj;
    });
  },

  transformSpecialLinkElements(data: PandocDocument): PandocDocument {
    return this.walkInline(data, (obj) => {
      if (
        !(
          obj.t === 'Link' &&
          obj.c?.[1]?.[0] &&
          obj.c?.[1]?.[0]?.t === 'Str' &&
          obj.c?.[1]?.[0]?.c?.startsWith('|') &&
          obj.c?.[1]?.[0]?.c?.endsWith('|') &&
          obj.c?.[2]?.[0]?.startsWith('##SUBST##|')
        )
      ) {
        return obj;
      }
      const text = obj.c[1][0].c.replace(/\|/g, '').toUpperCase();
      return {
        t: 'Str',
        c: text,
      };
    });
  },

  walkBlock(
    doc: PandocDocument,
    fn: (item: PandocBlock) => PandocBlock,
  ): PandocDocument {
    const walkBlock = (block: PandocBlock): PandocBlock => {
      if (block.t == 'Div') {
        return fn({ ...block, c: [block.c[0], block.c[1].map(walkBlock)] });
      } else if (block.t == 'BlockQuote') {
        return fn({ ...block, c: block.c.map(walkBlock) });
      } else if (block.t == 'DefinitionList') {
        return fn({
          ...block,
          c: block.c.map((c) => [c[0], c[1].map((el) => el.map(walkBlock))]),
        } as PandocBlock);
      } else if (block.t == 'OrderedList') {
        return fn({
          ...block,
          c: [block.c[0], block.c[1].map((el) => el.map(walkBlock))],
        });
      } else if (block.t == 'BulletList') {
        return fn({ ...block, c: block.c.map((el) => el.map(walkBlock)) });
      } else if (
        block.t === 'Para' ||
        block.t === 'Header' ||
        block.t === 'CodeBlock' ||
        block.t === 'HorizontalRule' ||
        block.t === 'RawBlock' ||
        block.t === 'Null' ||
        block.t === 'Note' ||
        block.t === 'Plain'
      ) {
        return fn(block);
      } else {
        console.warn(
          "You're in the place where you shouldn't get: a Pandoc block of unknown type",
        );
        return block;
      }
    };
    return { ...doc, blocks: doc.blocks.map(walkBlock) };
  },

  processData(data: PandocDocument): PandocDocument {
    data = this.transformCodeWithRef(data);
    data = this.convertBlocks(data);
    data = this.convertIncludes(data);
    data = this.transformImageElements(data);
    data = this.transformSpecialLinkElements(data);
    return data;
  },
  walkInline(
    doc: PandocDocument,
    fn: (item: PandocInline) => PandocInline,
  ): PandocDocument {
    const walkInline = (inline: PandocInline): PandocInline => {
      if (inline.t === 'Quoted') {
        return fn({ ...inline, c: [inline.c[0], inline.c[1].map(walkInline)] });
      } else if (inline.t === 'Cite') {
        return fn({ ...inline, c: [inline.c[0], inline.c[1].map(walkInline)] });
      } else if (
        inline.t === 'Code' ||
        inline.t === 'Space' ||
        inline.t === 'SoftBreak' ||
        inline.t === 'LineBreak' ||
        inline.t === 'Math' ||
        inline.t === 'RawInline'
      ) {
        return fn(inline);
      } else if (inline.t === 'Link') {
        return fn({
          ...inline,
          c: [inline.c[0], inline.c[1].map(walkInline), inline.c[2]],
        });
      } else if (inline.t === 'Image') {
        return fn({
          ...inline,
          c: [inline.c[0], inline.c[1].map(walkInline), inline.c[2]],
        });
      } else if (inline.t === 'Str') {
        return fn(inline);
      } else if (inline.t === 'Emph') {
        return fn({ ...inline, c: inline.c.map(walkInline) });
      } else if (inline.t === 'Strong') {
        return fn({ ...inline, c: inline.c.map(walkInline) });
      } else if (inline.t === 'Strikeout') {
        return fn({ ...inline, c: inline.c.map(walkInline) });
      } else if (inline.t === 'Superscript') {
        return fn({
          ...inline,
          c: [inline.c[0].map(walkInline), inline.c[1].map(walkInline)],
        });
      } else if (inline.t === 'Subscript') {
        return fn({
          ...inline,
          c: [inline.c[0].map(walkInline), inline.c[1].map(walkInline)],
        });
      } else if (inline.t === 'SmallCaps') {
        return fn({ ...inline, c: inline.c.map(walkInline) });
      } else {
        console.warn(
          "You're in the place where you shouldn't get: a Pandoc inline of unknown type",
        );
        return inline;
      }
    };

    return this.walkBlock(doc, (block) => {
      if (block.t === 'Header') {
        return {
          ...block,
          c: [block.c[0], block.c[1], block.c[2].map(walkInline)],
        };
      } else if (
        block.t === 'Para' ||
        block.t === 'Note' ||
        block.t === 'Plain'
      ) {
        return { ...block, c: block.c.map(walkInline) };
      } else {
        return block;
      }
    });
  },
};
