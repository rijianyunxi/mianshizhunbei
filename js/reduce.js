// let arr = [1,2,3,4,5,6]
let arr = [5,9]



Array.prototype.reduce1 = function(){
    for(let i = 0;i<this.length;i++){
        
    }
}


let res = arr.reduce((pre,next)=>{
    console.log({
        pre,next
    });
    
    return pre + next
})

console.log('res',res);