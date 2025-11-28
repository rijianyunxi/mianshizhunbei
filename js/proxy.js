let data = {
  name: "张三",
  age: 18,
};

let proxy = new Proxy(data, {
    get(target,prop,receiver){
        console.log('get',target,prop,receiver);
        return Reflect.get(target,prop,receiver)
    },

    set(target,prop,value,receiver){
        console.log('set',target,prop,value,receiver);
        return Reflect.set(target,prop,value,receiver)
    }
});

proxy.age = 99;
console.log(data.age);
