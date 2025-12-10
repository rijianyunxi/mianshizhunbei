let arr1 = [99,88,66,55]
let arr2 = [99,88,77,66]


function jiaoji(arr1,arr2){
    const map = new Map()
    for(let i of arr1){
        map.set(i,1)
    }
    for(let i of arr2){
        if(map.has(i)){
            map.set(i,map.get(i)+1)
        }
    }
    return [...map.keys()].filter(i=>map.get(i)>=2)
}


function bingji(arr1,arr2){
    return [...new Set([...arr1,...arr2])]
}

console.log(jiaoji(arr1,arr2));
console.log(bingji(arr1,arr2));
