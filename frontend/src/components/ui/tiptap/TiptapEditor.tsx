'use client';

import React, { useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { MentionList, MentionListRef } from './MentionList';
import 'tippy.js/dist/tippy.css';

export interface MentionItem {
  id: string;
  label: string;
}

export interface TiptapEditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  mentions?: MentionItem[];
  editable?: boolean;
}

export function TiptapEditor({
  content = '',
  onUpdate,
  onSubmit,
  placeholder = 'Digite sua mensagem...',
  mentions = [],
  editable = true,
}: TiptapEditorProps) {
  // Usar useRef para manter a referência atualizada das mentions
  const mentionsRef = useRef(mentions);
  mentionsRef.current = mentions;
  
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        renderText({ options, node }) {
          return `@${node.attrs.label || node.attrs.id}`;
        },
        suggestion: {
          char: '@',
          items: ({ query }: { query: string }) => {
            // Usar mentionsRef.current para obter o valor mais recente
            const currentMentions = mentionsRef.current;
            const filtered = currentMentions
              .filter((item) =>
                item.label.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 10);
            return filtered;
          },
          command: ({ editor, range, props }: any) => {
            // Usa o sistema nativo do Tiptap para inserir menção
            const mentionText = props.label.replace('@', '');
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContentAt(range.from, [
                {
                  type: 'mention',
                  attrs: {
                    id: props.id,
                    label: mentionText,
                  },
                },
              ])
              .insertContent(' ') // Adiciona espaço após a menção
              .run();
          },
          render: () => {
            let component: ReactRenderer<MentionListRef> | undefined;
            let popup: TippyInstance[] | undefined;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                component?.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) ?? false;
              },

              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 border border-gray-300 rounded-md',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          // Verifica se há uma menção sendo digitada (autocomplete aberto)
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          
          // Pega o texto completo do documento
          const docText = state.doc.textContent;
          const cursorPos = $from.pos;
          
          // Verifica se há @ incompleto próximo ao cursor (dentro de 50 caracteres)
          const searchStart = Math.max(0, cursorPos - 50);
          const searchEnd = Math.min(docText.length, cursorPos + 50);
          const textAroundCursor = docText.substring(searchStart, searchEnd);
          
          // Procura por @ que não tenha espaço depois (menção incompleta)
          const atIndex = textAroundCursor.lastIndexOf('@', cursorPos - searchStart);
          if (atIndex !== -1) {
            const textAfterAt = textAroundCursor.substring(atIndex + 1);
            const spaceIndex = textAfterAt.indexOf(' ');
            const newlineIndex = textAfterAt.indexOf('\n');
            
            // Se não há espaço ou quebra de linha depois do @, é uma menção incompleta
            if ((spaceIndex === -1 || spaceIndex > 20) && (newlineIndex === -1 || newlineIndex > 20)) {
              return false; // Deixa o Tiptap lidar com a menção
            }
          }
          
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
    },
  });

  // Atualizar editor quando content mudar (para limpar após enviar) - otimizado
  useEffect(() => {
    if (editor && content === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.clearContent();
    }
  }, [content]); // Removido editor das dependências

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          min-height: 100px;
          line-height: 1.6;
        }

        .tiptap-editor .ProseMirror p {
          margin: 0.5rem 0;
        }

        .tiptap-editor .ProseMirror p:first-child {
          margin-top: 0;
        }

        .tiptap-editor .ProseMirror p:last-child {
          margin-bottom: 0;
        }

        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder}';
          color: #adb5bd;
          pointer-events: none;
          height: 0;
          float: left;
        }

        .tiptap-editor .mention {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

      `}</style>
    </div>
  );
}

