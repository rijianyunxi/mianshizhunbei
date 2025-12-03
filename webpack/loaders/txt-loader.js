
function loadTxt(source){
    console.log("loadTxt is runing.....",source);
    
    return `
        module.exports = '${source}'
    `
}


export default loadTxt; 