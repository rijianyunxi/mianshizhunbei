// function throttle(fn, delay) {
//   let timer = null;
//   setTimeout(() => {
//     if (timer) return;
//     timer = setTimeout(() => {
//       timer = null;
//       fn.apply(this, args);
//     }, delay);
//   }, delay);
// }

// // 防抖
// function debounce(fn, delay) {
//   let timer = null;
//   return function (...args) {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(() => {
//       fn.apply(this, args);
//     }, delay);
//   };
// }


function once(fn) {
  let called = false;
  return function (...args) {
    if (!called) {
      called = true;
      fn.apply(this, args);
    }
  };
}


const res = once((n) => {
  console.log("log once")
  console.log(n)
})
res(1)
res(2)
res(3)