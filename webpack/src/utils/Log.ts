type NoErrorType<T> = [T] extends [Error] ? never : T
type OnlyError<T> = [T] extends [Error] ? Error : never


const INFO_STYLE: string = 'color: #38a169; font-weight: bold;'; // 绿色样式
const DANGER_STYLE: string = 'color: red; font-weight: bold;'; // 红色样式


class Log {
    info<T>(content: NoErrorType<T>): undefined {
        console.log(`%c${content}`, INFO_STYLE, );
    }
    danger<T>(error:OnlyError<T>){
        console.log(`%c${error}`, DANGER_STYLE, );
    }
}
export default Log;