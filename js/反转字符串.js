let str = "ABlDFLLD89";

function reverseStr(str) {
  let arr = [],
    res = "";
  for (let i of str) {
    arr.push(i);
  }
  while (arr.length > 0) {
    res += arr.pop();
  }
  return res;
}

console.log(reverseStr(str));
