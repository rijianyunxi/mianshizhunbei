let one = {a:1,b:2};
let two = {a:3,b:4};

function memo(fn){
    let cache = new Map();
    return function(obj){
        if(cache.has(obj)){
            return cache.get(obj);
        }
        cache.set(obj,fn(obj));
        return cache.get(obj);
    }
}

let value = memo(obj=>Object.values(obj))

console.log(value(one));
one.a = 999
console.log(value(one));