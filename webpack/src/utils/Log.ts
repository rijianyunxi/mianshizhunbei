type NoErrorType<T> = [T] extends [Error] ? never : T

const INFO_STYLE: string = 'color: #38a169; font-weight: bold;'; // 绿色样式

class Log {
    info<T>(title: NoErrorType<T>): undefined {
        console.log(`%c${title}`, INFO_STYLE, );
    }
}
export default Log;