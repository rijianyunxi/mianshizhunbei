Promise.prototype._all = function (promises) {
  return new Promise((reslove, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError("arguments must be an array"));
    }
    const len = promises.length;
    const results = new Array(len);
    let completedCount = 0;
    if (len === 0) {
      return resolve(results);
    }
    for (let i = 0; i < len; i++) {
      Promise.resolve(promises[i]).then((res) => {
        results[i] = res;
        completedCount++;
        if (completedCount === len) {
          resolve(results);
        }
      }, reject);
    }
  });
};


const s = '123';

s.c = '4';
s.d = '5';


const [a,b] = s;
const {c,d} = s;

console.log(a,b,c,d);

