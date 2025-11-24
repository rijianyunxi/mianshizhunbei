const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

class P {
  constructor(executor) {
    const resolve = (result) => {
      if (this.status !== PENDING) return;
      this.status = FULFILLED;
      this.result = result;
      this.run();
    };

    const reject = (result) => {
      if (this.status !== PENDING) return;
      this.status = REJECTED;
      this.result = result;
      this.run();
    };
    this.status = PENDING;
    this.result = undefined;
    this.handlers = [];

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new P((resolve, reject) => {
      this.handlers.push({
        onFulfilled,
        onRejected,
        resolve,
        reject,
      });
      this.run();
    });
  }

  run() {
    if (this.status === PENDING) return;
    this.microTask(() => {
      while (this.handlers.length) {
        let { onFulfilled, onRejected, resolve, reject } =
          this.handlers.shift();
        let setlled = this.status === FULFILLED ? onFulfilled : onRejected;
        this.runOnce(setlled, resolve, reject);
      }
    });
  }

  runOnce(setlled, resolve, reject) {
    if (typeof setlled !== "function") {
      setlled = this.status === FULFILLED ? resolve : reject;
      setlled(this.result);
      return;
    }
    try {
      let x = setlled(this.result);
      if (this.isPromise(x)) {
        x.then(resolve, reject);
      } else {
        resolve(x);
      }
    } catch (err) {
      reject(err);
    }
  }

  isPromise(obj) {
    return (
      obj != null &&
      (typeof obj === "object" || typeof obj === "function") &&
      typeof obj.then === "function"
    );
  }

  microTask(fn) {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(fn);
    } else if (typeof setImmediate === "function") {
      setImmediate(fn);
    } else if (typeof MutationObserver === "function") {
      let observer = new MutationObserver(() => {
        fn();
        observer.disconnect();
      });
      const text = document.createTextNode("1");
      observer.observe(text, {
        characterData: true,
      });
      text.data = "2";
    } else {
      setTimeout(fn(), 0);
    }
  }
}

const p = new P((resolve, reject) => {
  setTimeout(() => {
    resolve("setTimeout 2");
  }, 2000);
});

p.then((res) => {
  console.log("res", res);
  return new P((r, j) => {
    setTimeout(() => {
      r("two Promise");
    }, 2000);
  });
}).then((rr) => {
  console.log("rr", rr);
});
