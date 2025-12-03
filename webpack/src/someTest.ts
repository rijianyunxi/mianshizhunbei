import Log from '@/utils/Log'
import '@/assets/reset.css'
import Button from "@/utils/ClassMenu"

type MPick<T, K extends keyof T> = {
    [P in K]: T[P]
}

function someTest() {
    const log = new Log();

    log.info<string>("hello webpak,i'm Log")

    log.danger<Error>(new Error("Log danger testing..."))

    const button: Button = new Button("c", 'd', 1)
    console.log(button, button.exec());
}



export default someTest;
