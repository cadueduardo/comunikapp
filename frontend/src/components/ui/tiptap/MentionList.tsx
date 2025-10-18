'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export interface MentionListProps {
  items: Array<{ id: string; label: string }>;
  command: (item: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (event: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
        {props.items.length > 0 ? (
          props.items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
              }`}
              onClick={() => selectItem(index)}
            >
              {item.label}
            </button>
          ))
        ) : (
          <div className="px-4 py-2 text-sm text-gray-500">Nenhuma versão encontrada</div>
        )}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';

