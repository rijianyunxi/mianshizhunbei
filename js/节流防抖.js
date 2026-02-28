/**
 * 节流函数
 */


function throttle(fn, delay) {
    let lastTime = 0;
    return function (...args) {
        let nowTime = Date.now();
        if (nowTime - lastTime >= delay) {
            lastTime = nowTime;
            fn.apply(this, args);
        }
    }
}


/**
 * 防抖函数
 */


function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
