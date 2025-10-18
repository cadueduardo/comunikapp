import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import 'quill-mention/autoregister';

interface VersaoArte {
  id: string;
  versao: string;
  descricao?: string;
}

interface QuillMentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  versoesDisponiveis: VersaoArte[];
}

export function QuillMentionEditor({ 
  value, 
  onChange, 
  onKeyDown,
  placeholder = "Digite sua mensagem... Use @V1 para mencionar versões",
  versoesDisponiveis
}: QuillMentionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    // SOLUÇÃO REAL baseada no quill-mention
    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: false,
        mention: {
          allowedChars: /^[A-Za-z0-9\s\-]*$/,
          mentionDenotationChars: ['@'],
          source: function(searchTerm: string, renderList: (items: any[], searchTerm: string) => void) {
            // Dados mock para teste
            const mockData = [
              { id: '1', value: 'V1 - Banner Aprovação' },
              { id: '2', value: 'V2 - Adesivo Laminado' },
              { id: '3', value: 'V3 - Flyer Promocional' }
            ];

            if (searchTerm.length === 0) {
              renderList(mockData, searchTerm);
            } else {
              const matches = mockData.filter(item => 
                item.value.toLowerCase().includes(searchTerm.toLowerCase())
              );
              renderList(matches, searchTerm);
            }
          },
          onSelect: function(item: any, insertItem: (data: any) => void) {
            insertItem({
              id: item.id,
              value: item.value,
              denotationChar: '@'
            });
          },
          spaceAfterInsert: true,
          renderItem: function(item: any, searchTerm: string) {
            const div = document.createElement('div');
            div.className = 'ql-mention-list-item';
            div.innerHTML = `
              <div style="padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                <span style="color: #3b82f6;">@</span>
                <span>${item.value}</span>
              </div>
            `;
            return div;
          }
        }
      }
    });

    // Eventos
    quillRef.current.on('text-change', () => {
      const content = quillRef.current?.root.innerHTML || '';
      onChange(content);
    });

    quillRef.current.on('keydown', (e: KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e as any);
      }
    });

    // Sincronizar valor inicial
    if (value) {
      quillRef.current.root.innerHTML = value;
    }

  }, [onChange, onKeyDown, placeholder]);

  // Sincronizar valor externo
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="quill-mention-editor">
      <div ref={editorRef} />
      
      <style jsx global>{`
        .quill-mention-editor .ql-editor {
          padding: 12px;
          min-height: 50px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        
        .quill-mention-editor .ql-editor:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .quill-mention-editor .ql-mention-list-container {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          max-height: 200px;
          overflow-y: auto;
          z-index: 20;
        }
        
        .quill-mention-editor .ql-mention-list-item {
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .quill-mention-editor .ql-mention-list-item:hover,
        .quill-mention-editor .ql-mention-list-item.ql-selected {
          background-color: #eff6ff;
          color: #1e40af;
        }
        
        .quill-mention-editor .ql-mention-list-item:last-child {
          border-bottom: none;
        }
        
        /* Estilo para menções no editor */
        .quill-mention-editor .ql-editor span[data-mention] {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #bfdbfe;
        }
      `}</style>
    </div>
  );
}
