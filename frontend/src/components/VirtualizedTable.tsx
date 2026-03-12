import React, { useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
  }[];
  rowHeight?: number;
  onRowClick?: (item: T) => void;
}

/**
 * Virtualized table component for large datasets
 * Only renders visible rows for better performance
 */
export function VirtualizedTable<T extends { id: number | string }>({
  data,
  columns,
  rowHeight = 60,
  onRowClick
}: VirtualizedTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Memoize virtualizer to prevent recreation
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  // Memoize virtual items
  const virtualItems = useMemo(
    () => rowVirtualizer.getVirtualItems(),
    [rowVirtualizer]
  );

  // Memoize total size
  const totalSize = useMemo(
    () => rowVirtualizer.getTotalSize(),
    [rowVirtualizer]
  );

  // Memoize row click handler
  const handleRowClick = useCallback(
    (item: T) => {
      if (onRowClick) {
        onRowClick(item);
      }
    },
    [onRowClick]
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Table Header */}
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <style>{`[data-grid-cols="${columns.length}"] { grid-template-columns: repeat(${columns.length}, 1fr); }`}</style>
        <div className="grid" data-grid-cols={columns.length}>
          {columns.map((column) => (
            <div
              key={column.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="overflow-auto h-[600px]"
      >
        <style>{`[data-total-size="${totalSize}"] { height: ${totalSize}px; }`}</style>
        <div
          data-total-size={totalSize}
          className="w-full relative"
        >
          {virtualItems.map((virtualRow) => {
            const item = data[virtualRow.index];
            if (!item) return null;
            return (
              <React.Fragment key={item.id}>
                <style>{`[data-vr-id="${item.id}"] { height: ${virtualRow.size}px; transform: translateY(${virtualRow.start}px); }`}</style>
                <div
                  data-vr-id={item.id}
                  className={`absolute top-0 left-0 w-full border-b border-gray-100 dark:border-gray-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 backdrop-blur-[2px] transition-all duration-300 ${onRowClick ? 'cursor-pointer' : ''
                    }`}
                  onClick={() => handleRowClick(item)}
                >
                  <div
                    className="grid h-full items-center"
                    data-grid-cols={columns.length}
                  >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-white"
                    >
                      {column.render(item)}
                    </div>
                  ))}
                </div>
              </div>
            </React.Fragment>
          );
          })}
        </div>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}

export default VirtualizedTable;
