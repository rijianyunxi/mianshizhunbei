import { useRef, useState,useMemo  } from 'react';
import type { ReactNode, UIEvent } from 'react';

interface VirtualListProps<T> {
  data: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  bufferCount?: number; // 新增：缓冲区数量
  rowKey?: (item: T) => string | number; // 新增：自定义 key 获取器
}

export default function VirtualList<T>({
  data,
  itemHeight,
  height,
  renderItem,
  header,
  footer,
  empty,
  bufferCount = 5, // 默认缓冲 5 项
  rowKey,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 核心优化：只存 startIndex，不再存具体的 scrollTop
  const [startIndex, setStartIndex] = useState(0);

  const totalHeight = data.length * itemHeight;

  // 使用 useMemo 计算可视范围，包含缓冲区
  const { visibleData, startOffset, renderStartIndex } = useMemo(() => {
    // 实际可视区域的结束索引
    const endIndex = Math.ceil((startIndex * itemHeight + height) / itemHeight);
    
    // 加上缓冲区
    const renderStartIndex = Math.max(0, startIndex - bufferCount);
    const renderEndIndex = Math.min(data.length, endIndex + bufferCount);

    const visibleData = data.slice(renderStartIndex, renderEndIndex);
    
    // 计算偏移量，使用 transform 代替 absolute top
    const startOffset = renderStartIndex * itemHeight;

    return { visibleData, startOffset, renderStartIndex };
  }, [data, startIndex, itemHeight, height, bufferCount]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    // 计算当前的 startIndex
    const currentStartIndex = Math.floor(scrollTop / itemHeight);

    // 核心优化：只有当 startIndex 变化时才触发 React 更新
    if (currentStartIndex !== startIndex) {
      setStartIndex(currentStartIndex);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc' }}>
      {header && <div>{header}</div>}
      
      <div
        ref={containerRef}
        style={{ height, overflowY: 'auto', position: 'relative' }}
        onScroll={onScroll}
      >
        {data.length === 0 && empty ? (
          <div style={{ padding: 16 }}>{empty}</div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            {/* 优化：使用 transform 移动可视区域，减少内部 item 的 absolute 布局复杂性 */}
            <div
              style={{
                transform: `translate3d(0, ${startOffset}px, 0)`,
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%'
              }}
            >
              {visibleData.map((item, i) => {
                const index = renderStartIndex + i;
                // 优先使用 rowKey，否则回退到 index
                const key = rowKey ? rowKey(item) : index;
                return (
                  <div key={key} style={{ height: itemHeight }}>
                    {renderItem(item, index)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {footer && <div>{footer}</div>}
    </div>
  );
}