const obj = {
    a:1,
    b:2,
    c:{
        d:3,
        e:4
    },
    fn:function(){
        console.log(this.a);
    },
    date:new Date()
}

/**
 * JSON.parse(JSON.stringify(obj)) 可以深拷贝对象，但是有一些限制：
 * 1. 不能拷贝函数
 * 2. 不能拷贝日期对象
 * 3. 不能拷贝正则表达式
 * 4. 不能拷贝 undefined
 */
// console.log(JSON.parse(JSON.stringify(obj)));

/**
 * 
 * @param {*} obj 要深拷贝的对象
 * @returns 深拷贝后的对象
 */
function deepClone(obj){
    if(typeof obj !== 'object' || obj === null){
        return obj;
    }
    let cloneObj = Array.isArray(obj) ? [] : {};
    for(let key in obj){
        if(obj.hasOwnProperty(key)){
            cloneObj[key] = deepClone(obj[key]);
        }
    }
    return cloneObj;
}

console.log(deepClone(obj));

/**
 * for in 遍历对象的可枚举属性，包括原型链上的属性
 * 可以使用hasOwnProperty方法判断属性是否是对象自身的属性
 */
// function T(name, age) {
//     this.name = name;
//     this.age = age;
// }
// T.prototype._c = 1999
// T.prototype.say = function() {
//     console.log(this.name, this.age);
// }
// let t = new T('张三', 18);
// for(let key in t){
//     console.log(key);
// }
