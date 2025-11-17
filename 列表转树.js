const arr = [
  { id: 1, pid: 0, name: '集团公司' },
  { id: 2, pid: 1, name: '研发中心' },
  { id: 3, pid: 1, name: '市场中心' },
  { id: 4, pid: 1, name: '行政中心' },

  { id: 5, pid: 2, name: '前端部' },
  { id: 6, pid: 2, name: '后端部' },
  { id: 7, pid: 2, name: '测试部' },

  { id: 8, pid: 3, name: '国内市场' },
  { id: 9, pid: 3, name: '海外市场' },

  { id: 10, pid: 4, name: '人事部' },
  { id: 20, pid: 4, name: '财务部' },

  { id: 11, pid: 5, name: 'Web组' },
  { id: 12, pid: 5, name: '移动端组' },
  { id: 13, pid: 5, name: 'UI组' },

  { id: 14, pid: 6, name: 'Java组' },
  { id: 15, pid: 6, name: 'Node组' },

  { id: 16, pid: 8, name: '电商渠道' },
  { id: 17, pid: 8, name: '线下推广' },
  { id: 18, pid: 9, name: '北美区' },
  { id: 19, pid: 9, name: '欧洲区' },

  { id: 21, pid: 13, name: '视觉设计' },
  { id: 22, pid: 13, name: '交互设计' }
]

function toTree(arr,pid){
    return arr.filter(l=>l.pid === pid).map(l=>{
        return {
            ...l,
            children:toTree(arr,l.id)
        }
    })
    
}

let tree = toTree(arr,0)

console.log(tree);
