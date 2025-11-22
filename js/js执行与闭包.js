let obj = {
    a:1,
    b:function(){
        
        setTimeout((function(){
            console.log(this.a)
        }),3000)
    },
    c(){
        console.log(this.a)
    }
}




