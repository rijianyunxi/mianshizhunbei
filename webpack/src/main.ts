import Log from '@/utils/Log'
import '@/assets/reset.css'
import Button from "@/utils/ClassMenu"

const log = new Log();

log.info<string>("hello webpak,i'm ts loader")

log.danger<Error>(new Error("1111"))


type MPick<T, K extends keyof T> = {
    [P in K]: T[P]
}


const button: Button = new Button("c", 'd', 1)
console.log(button,button.exec());

