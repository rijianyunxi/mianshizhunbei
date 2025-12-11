/**
 * this 指向
 * 1. 全局环境下，this 指向 window
 * 2. 函数调用下，this 指向调用它的对象
 * 3. 构造函数调用下，this 指向新创建的实例对象
 * 4. call、apply、bind 调用下，this 指向指定的对象
 * 5. 箭头函数下，this 指向定义时的对象，不能被改变
 * 6. DOM 事件绑定下，this 指向绑定事件的元素
 * 7. 立即执行函数下，this 指向 window
 * 8. 回调函数下，this 指向 window
 * 9. 严格模式下，this 指向 undefined
 * 10. 箭头函数下，this 指向定义时的对象，不能被改变
 * 人话谁调用this指向谁，箭头函数在哪定义就是谁，被回掉函数调用时，this 指向定义时的对象
 */

let o = {
    name: 'o',
    sayName() {
        console.log(11, this.name);
        setTimeout( ()=> {
            console.log(22, this.name);
        }, 1000)
    }
}

o.sayName()

// let sayName = o.sayName;
// sayName()