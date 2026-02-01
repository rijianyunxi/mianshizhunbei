
Promise.prototype._all = function (promises) {
    return new Promise((reslove, reject) => {
        let results = [];
        let completedCount = 0;
        let len = promises.length
        for (let item of promises) {
            let i = completedCount;
            Promise.resolve(item).then((res) => {
                completedCount++;
                results[i] = res;
                if (completedCount === len) reslove(results)
            }, reject)
        }
    })
}