var a = 99;
let obj = {
    a:1,
    b:()=>{
        console.log(this.a)
        // setTimeout((function(){
        //     console.log(this.a)
        // }),1000)
    },
    c(){
        console.log(this.a)
    }
}

console.log(obj.b());



