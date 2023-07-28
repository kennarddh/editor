import { CODE, ElementTransformer, Transformer, TRANSFORMERS } from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { $createCodeBlockNode, CodeBlockNode } from '../codeblock/CodeBlockNode'
import { coreSystem } from '../core/realmPlugin'

// insert CM code block type rather than the default one
function patchMarkdownTransformers(transformers: Transformer[]) {
  const transformersCopy = [...transformers]
  const codeTransformer = transformersCopy.find((t) => t === CODE) as ElementTransformer

  const codeTransformerCopy: ElementTransformer = {
    ...codeTransformer,
    dependencies: [CodeBlockNode],
    replace: (parentNode, _children, match) => {
      const codeBlockNode = $createCodeBlockNode({ code: '', language: match ? match[1] : '', meta: '' })
      parentNode.replace(codeBlockNode)
      setTimeout(() => codeBlockNode.select(), 80)
    }
  }

  // replace the code transformer with the copy
  transformersCopy.splice(transformersCopy.indexOf(codeTransformer), 1, codeTransformerCopy)

  return transformersCopy
}

export const [markdownShorcutPlugin] = realmPlugin({
  systemSpec: system((_) => ({}), [coreSystem]),

  init: (realm) => {
    realm.pubKey('addComposerChild', () => <MarkdownShortcutPlugin transformers={patchMarkdownTransformers(TRANSFORMERS)} />)
  }
})

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
