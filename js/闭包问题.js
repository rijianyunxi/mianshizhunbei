function a() {
    let i = 99;
    setTimeout(() => {
        console.log(i)
    }, 3000)

    return function setI(count) {
        i += count;
    }
}
let setI = a();
setI(999)

// react闭包陷阱
let isFirstFlag = true;
function render(j) {
    let i = j + 1;
    if (isFirstFlag) {
        setTimeout(() => {
            console.log(i);
        }, 3000)
    }
    isFirstFlag = false;
    setTimeout(() => {
        render(999)
    })

}
render(0);


for (var i = 0; i < 10; i++) {
    setTimeout(() => {
        console.log(i)
    })
}

// 立即执行或let
for (var i = 0; i < 10; i++) {
    ((i) => {
        setTimeout(() => {
            console.log(i)
        })
    })(i)
}