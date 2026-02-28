/**
 * 实现forEach方法
 */

Array.prototype.forEach1 = function (callback, thisArg) {
  for (let i = 0; i < this.length; i++) {
    callback.call(thisArg, this[i], i, this);
  }
};

/**
 * 实现map方法
 */

Array.prototype.map1 = function (callback, thisArg) {
  let res = [];
  for (let i = 0; i < this.length; i++) {
    res.push(callback.call(thisArg, this[i], i, this));
  }
  return res;
};

/**
 * 实现filter方法
 */

Array.prototype.filter1 = function (callback, thisArg) {
  let res = [];
  for (let i = 0; i < this.length; i++) {
    if (callback.call(thisArg, this[i], i, this)) {
      res.push(this[i]);
    }
  }
  return res;
};

/**
 * 实现reduce方法
 */

Array.prototype.myReduce = function (callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;
  if (initialValue === undefined) {
    accumulator = this[0];
    startIndex = 1;
    if (startIndex >= this.length) {
      throw new TypeError("Reduce of empty array with no initial value");
    }
  }

  for (let i = startIndex; i < this.length; i++) {
    if (Object.prototype.hasOwnProperty.call(this, i)) {
      accumulator = callback(accumulator, this[i], i, this);
    }
  }

  return accumulator;
};
