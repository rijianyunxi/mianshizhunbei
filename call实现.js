Function.prototype.call2 = function(context) {
  // 这里是为了考虑到context为空的情况，为空则设置为Window对象
  context = !context  ? window : Object(context);
  // 这一步是取出arguments类数组对象除要绑定的对象外的参数，在本🌰中为  "努力", 18
  let arg = [...arguments].slice(1);
  // 这里的this是调用call2的对象，也就是bar
  context.fn = this;
  // 执行bar函数
  let res = context.fn(...arg);
  // 删除bar，避免对foo产生影响
  delete context.fn;
  // 返回函数的返回值
  return res;
};

const foo = 1;

function bar(name, age) {
  console.log(this===1);
  console.log(name);
  console.log(age);
}
bar.bind(1, ["努力"], 18)(); 
// bar.call2(foo, "努力", 18); 






