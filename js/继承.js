

function Parent() {
    this.name = '张三'
}
Parent.prototype.say = function() {
    console.log(this.name);
}

/**
 * 原型链继承
 * 引用类型共享：父类的属性如果是数组/对象，所有子类实例会共享同一个。改一个，全变了。
 * 不能传参：创建子类实例时，无法向父类构造函数传参。
 */

function Child() {
    this.age = 18
}
Child.prototype = new Parent()


/**
 * 构造函数继承
 * 无法继承方法：只能继承父类构造函数里的属性，父类原型（prototype）上的方法完全继承不到。
 * 每次创建实例都要重新定义方法，无法复用。
 */

function Child1() {
    Parent.call(this)
    this.age = 18
}



/**
 * 组合继承
 * 父类构造函数被调用了两次（一次在 new Parent()，一次在 Parent.call）。
 * 这导致子类原型上多了一组无用的属性，浪费内存。
 */
function Child2() {
    Parent.call(this)
    this.age = 18
}
Child2.prototype = new Parent()


/**
 * 寄生组合继承
 * 解决了组合继承的问题：父类构造函数只调用了一次，避免了子类原型上多了一组无用的属性。
 */

function Child3() {
    Parent.call(this)
    this.age = 18
}
Child3.prototype = Object.create(Parent.prototype)
Child3.prototype.constructor = Child3


/**
 * 寄生式继承
 */

function createAnother(original) {
    let clone = object(original); // 创建新对象
    clone.sayHi = function() {};  // 增强（添加方法）
    return clone;
}


/**
 * 寄生组合继承的优势：
 * 1. 父类构造函数只调用了一次，避免了子类原型上多了一组无用的属性。
 * 2. 子类原型上的方法是父类原型上的方法的一个副本，不会共享引用类型的属性。
 */

function inheritPrototype(child, parent) {
    // 1. 创建对象：创建一个新对象，它的 __proto__ 指向 parent.prototype
    //    这里没有调用 new Parent()，所以没有执行父类构造函数！
    let prototype = Object.create(parent.prototype); 
    
    // 2. 增强对象：把 constructor 指回 child
    prototype.constructor = child; 
    
    // 3. 赋值对象：把这个干净的新对象给 child.prototype
    child.prototype = prototype; 
}

function Child(name, age) {
    // 依然保留构造函数窃取，继承实例属性
    Parent.call(this, name); 
    this.age = age;
}

// ✅ 关键一步：只继承方法，不产生多余属性，不执行构造函数
inheritPrototype(Child, Parent);


/**
 * new 关键字
 * 1. 创建一个新对象
 * 2. 链接到原型
 * 3. 绑定 this，执行构造函数
 * 4. 返回新对象
 */

function myNew(constructor, ...args) {
    // 1. 创建一个新对象
    let obj = {};
    
    // 2. 链接到原型
    obj.__proto__ = constructor.prototype;
    
    // 3. 绑定 this，执行构造函数
    let result = constructor.apply(obj, args);
    
    // 4. 返回新对象
    return result instanceof Object ? result : obj;
}


