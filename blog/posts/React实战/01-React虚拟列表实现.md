---
title: React 虚拟列表实现
date: 2026-03-28
tags: [React, 虚拟列表, 性能优化, 面试]
---

# React 虚拟列表实现

虚拟列表是处理大数据渲染的利器，React 中实现虚拟列表有多种方式。

## 1. 固定高度虚拟列表

```tsx
function VirtualList({ items, itemHeight = 50, visibleCount = 10 }) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = startIndex + visibleCount
  
  const visibleItems = items.slice(startIndex, endIndex + 5) // 缓冲
  
  return (
    <div
      ref={containerRef}
      style={{ height: items.length * itemHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
        {visibleItems.map((item, i) => (
          <div key={item.id} style={{ height: itemHeight }}>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 2. 动态高度虚拟列表

```tsx
function DynamicVirtualList({ items }) {
  const [visibleItems, setVisibleItems] = useState([])
  const [offsets, setOffsets] = useState([])
  const containerRef = useRef(null)
  
  const measureItem = useCallback((node, index) => {
    if (node) {
      const height = node.getBoundingClientRect().height
      // 更新高度缓存
      updateOffset(index, height)
    }
  }, [])
  
  return (
    <div ref={containerRef}>
      {visibleItems.map((item, i) => (
        <div key={item.id} ref={(node) => measureItem(node, i)}>
          {item.content}
        </div>
      ))}
    </div>
  )
}
```

## 3. transform 优化

```tsx
// 用 transform 代替 top
<div style={{ 
  transform: `translateY(${offsetY}px)`,
  position: 'absolute',
  width: '100%'
}}>
  {item.content}
</div>
```

## 4. react-window 库

```tsx
import { FixedSizeList } from 'react-window'

function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width={300}
    >
      {({ index, style }) => (
        <div style={style}>{items[index].content}</div>
      )}
    </FixedSizeList>
  )
}
```

## 5. 面试高频问题

### Q: 虚拟列表的核心思路？

只渲染可视区域的元素，用 transform 定位。

### Q: 动态高度如何处理？

预估高度 + 实际测量 + 缓存。

### Q: 缓冲区的作用？

上下多渲染几个元素，避免滚动时出现空白。

## 6. 总结

虚拟列表通过只渲染可视区域元素，大幅提升大数据列表的渲染性能。
