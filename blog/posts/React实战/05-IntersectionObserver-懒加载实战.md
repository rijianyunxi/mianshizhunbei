---
title: IntersectionObserver 懒加载实战
date: 2026-03-28
tags: [React, IntersectionObserver, 懒加载, 面试]
---

# IntersectionObserver 懒加载实战

IntersectionObserver 是浏览器原生 API，用于检测元素是否进入视口，是懒加载的利器。

## 1. 基本用法

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('进入视口')
      // 执行加载逻辑
    }
  })
}, {
  root: null, // 视口
  rootMargin: '0px',
  threshold: 0.1 // 10% 可见时触发
})

observer.observe(element)
```

## 2. React Hook 封装

```tsx
function useIntersectionObserver(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)
    
    observer.observe(element)
    
    return () => observer.disconnect()
  }, [ref, options])
  
  return isIntersecting
}
```

## 3. 图片懒加载

```tsx
function LazyImage({ src, alt }) {
  const imgRef = useRef()
  const isVisible = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px' // 提前 50px 开始加载
  })
  
  return (
    <div ref={imgRef} style={{ minHeight: 100 }}>
      {isVisible && <img src={src} alt={alt} />}
    </div>
  )
}
```

## 4. 无限滚动

```tsx
function InfiniteList() {
  const loadingRef = useRef()
  const [items, setItems] = useState([])
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadMore()
      }
    }, { threshold: 0.1 })
    
    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div>
      {items.map(item => <Item key={item.id} {...item} />)}
      <div ref={loadingRef}>Loading...</div>
    </div>
  )
}
```

## 5. 曝光统计

```tsx
function TrackView({ children, eventName }) {
  const ref = useRef()
  const hasTracked = useRef(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasTracked.current) {
        hasTracked.current = true
        analytics.track(eventName)
      }
    }, { threshold: 0.5 })
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [eventName])
  
  return <div ref={ref}>{children}</div>
}
```

## 6. 面试高频问题

### Q: IntersectionObserver 相比 scroll 事件的优势？

- 性能更好：不需要在 scroll 事件中计算
- 异步执行：不会阻塞主线程
- 更精确：可以检测元素部分可见

### Q: threshold 的作用？

表示元素可见比例达到多少时触发回调。0 表示只要有一像素可见就触发。

## 7. 总结

IntersectionObserver 是懒加载的利器，性能优秀，使用简单。
