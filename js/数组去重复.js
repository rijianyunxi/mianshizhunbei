let arr = [99,99,88,66,66,55]




// O(n^2)
function q (arr){
    let res = []
    for(let i = 0;i<arr.length;i++){
        if(res.indexOf(arr[i]) === -1){
            res.push(arr[i])
        }
    }
    return res
}


// O(n^2)
function q1(arr){
    let res = []
    for(let i = 0;i<arr.length;i++){
        if(!res.includes(arr[i])){
            res.push(arr[i])
        }
    }
    return res
}

// O(n^2)
function q2(arr){
    return arr.reduce((pre,next)=>{
        if(!pre.includes(next)){
            pre.push(next)
        }
        return pre
    },[])
}
// O(n)
function q2_optimized(arr){
  return Array.from(
    arr.reduce((set,next)=>{
        set.add(next)
        return set
    },new Set())
  )
}

console.log(q2(arr));
