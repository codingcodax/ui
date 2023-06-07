/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from 'fs';
import {
  defineDocumentType,
  defineNestedType,
  makeSource,
  type ComputedFields,
} from 'contentlayer/source-files';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import { codeImport } from 'remark-code-import';
import remarkGfm from 'remark-gfm';
// import { getHighlighter, loadTheme } from 'shiki';
import { visit } from 'unist-util-visit';

import type { UnistNode, UnistTree } from '~/types';
import { rehypeComponent, rehypeNpmCommand } from './src/helpers';

const computedFields: ComputedFields = {
  slug: {
    type: 'string',
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.split('/').slice(1).join('/'),
  },
};

const RadixProperties = defineNestedType(() => ({
  name: 'RadixProperties',
  fields: {
    link: {
      type: 'string',
    },
    api: {
      type: 'string',
    },
  },
}));

export const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: 'docs/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    published: {
      type: 'boolean',
      default: true,
    },
    radix: {
      type: 'nested',
      of: RadixProperties,
    },
    featured: {
      type: 'boolean',
      default: false,
      required: false,
    },
    component: {
      type: 'boolean',
      default: false,
      required: false,
    },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: './src/content',
  documentTypes: [Doc],
  mdx: {
    remarkPlugins: [remarkGfm, codeImport],
    rehypePlugins: [
      rehypeSlug,
      rehypeComponent,
      () => (tree: UnistTree) => {
        visit(tree, (node: UnistNode) => {
          if (node?.type === 'element' && node?.tagName === 'pre') {
            const [codeEl] = node.children;

            if (codeEl.tagName !== 'code') return;

            if (codeEl.data?.meta) {
              // Extract event from meta and pass it down the tree.
              const regex = /event="([^"]*)"/;
              const match = codeEl.data?.meta.match(regex);

              if (match) {
                node.__event__ = match ? match[1] : null;
                codeEl.data.meta = codeEl.data.meta.replace(regex, '');
              }
            }

            node.__rawString__ = codeEl.children?.[0].value;
            node.__src__ = node.properties?.__src__;
          }
        });
      },
      [
        rehypePrettyCode,
        {
          // theme: {
          //   dark: JSON.parse(
          //     readFileSync(path.resolve('./helpers/themes/dark.json'), 'utf-8'),
          //   ),
          //   light: JSON.parse(
          //     readFileSync(path.resolve('./helpers/themes/dark.json'), 'utf-8'),
          //   ),
          // },
          // getHighlighter: async () => {
          //   const theme = await loadTheme(
          //     path.join(process.cwd(), 'lib/vscode-theme.json'),
          //   );
          //   return await getHighlighter({ theme });
          // },
          onVisitLine: (node) => {
            // Prevent lines from collapsing in `display: grid` mode, and allow empty
            // lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }];
            }
          },
          onVisitHighlightedLine: (node) => {
            node.properties.className.push('line--highlighted');
          },
          onVisitHighlightedWord: (node) => {
            node.properties.className = ['word--highlighted'];
          },
        },
      ],
      () => (tree: UnistTree) => {
        visit(tree, (node: UnistNode) => {
          if (node?.type === 'element' && node?.tagName === 'div') {
            if (!('data-rehype-pretty-code-fragment' in node.properties))
              return;

            const preElement = node.children.at(-1);

            if (preElement.tagName !== 'pre') return;

            preElement.properties['__withMeta__'] =
              node.children.at(0).tagName === 'div';
            preElement.properties['__rawString__'] = node.__rawString__;

            if (node.__src__) {
              preElement.properties['__src__'] = node.__src__;
            }

            if (node.__event__) {
              preElement.properties['__event__'] = node.__event__;
            }
          }
        });
      },
      rehypeNpmCommand,
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['subheading-anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
    ],
  },
});