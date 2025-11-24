
type A = {
    name:string;
    hobby:string
}
type B = {
    age:number;
}
type C = A & B
const obj:C = {name:"sjt",hobby:"1",age:1}
console.log(obj);
type D = Pick<C,"name" | "age">
const obj2:D = {name:"sjt",age:1}
console.log(obj2);
type E= Omit<C,"name" | "age">
const obj3:E = {hobby:"1"}
console.log(obj3);


function getPropValue<T>(obj: T, key:keyof T):T[keyof T] {
    return obj[key]
}
getPropValue({a:1},'a')



