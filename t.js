function throttle(fn, delay) {
  let timer = null;
  setTimeout(() => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  }, delay);
}

// 防抖
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}