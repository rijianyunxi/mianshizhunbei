/**
 * 封装一个简单的压缩算法，它可以将字符串中的连续重复字符压缩为字符和重复次数的形式。
 * 输入"aaaaaabbbbbbbaaacck”应该输出"a6b6a3c2k"
 * @param {string} str - 输入的字符串
 * @returns {string} - 压缩后的字符串
 */

// function dealStr(str){
//     let res = "";
//     let count = 0;
//     for(let i=0;i<str.length;i++){
//         if(str[i]===str[i+1]){
//             count++;
//         }else{
//             res += str[i] + (count>1?count:"");
//             count = 1;
//         }
//     }
//     return res;
// }



console.log(dealStr("aaaaaabbbbbbbaaacck"));
