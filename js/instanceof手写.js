// instanceof 原理

function instanceof1(left, right) {
  if (typeof left !== "object" || left === null) return false;
  let proto = left.__proto__;
  let prototype = right.prototype;
  while (true) {
    if (proto === null) return false;
    if (proto === prototype) return true;
    proto = proto.__proto__;
  }
}
