import Log from '@/utils/Log'
import '@/assets/reset.css'


const log = new Log();

log.info<string>("hello webpak,i'm ts loader")

log.danger<Error>(new Error("1111"))


type MPick<T,K extends keyof T> = {
    [P in K]: T[P]
}
