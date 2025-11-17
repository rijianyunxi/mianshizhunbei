
let arr = [100]
let objectArray = [{count:100},{count:200},{count:300},{count:400},{count:500}]






Array.prototype.reduce1 = function(callback, initValue) {
  if (typeof callback !== 'function') {
    throw new TypeError(callback + ' is not a function');
  }

  const arr = this;
  const len = arr.length;
  let i = 0;
  let accumulator;

  if (initValue !== undefined) {
    accumulator = initValue;
  } else {
    // 找到第一个存在的元素作为初始值
    while (i < len && !(i in arr)) i++;
    if (i >= len) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    accumulator = arr[i++];
  }

  for (; i < len; i++) {
    if (i in arr) {
      accumulator = callback(accumulator, arr[i], i, arr);
    }
  }

  return accumulator;
};



let res  = arr.reduce1((pre, cur) => pre + cur)

console.log(res);