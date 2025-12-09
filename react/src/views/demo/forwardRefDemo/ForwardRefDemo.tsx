import type { FC } from "react"
import { useRef, useEffect } from 'react'
import Child from "./Child"

type childRefType = {
    see: () => void,
    getCount: () => number
}


function testNumber<T extends number, U extends number>(number1: T, number2: U): T | U {
    return (number1 + number2) as T | U;
};
testNumber<number, number>(1, 2);


function testNoNumber<T>(
    params: T extends number ? never : T
) {
    return params;
}

testNoNumber('123');




const ForwardRefDemo: FC = () => {
    const ChildRef = useRef<childRefType>(null);
    useEffect(() => {
        ChildRef.current?.see()
    }, [])
    return (
        <div style={{ height: '100px', display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center', borderRadius: '10px', background: '#f7f7f7' }}>
            <p onClick={() => console.log(ChildRef.current?.getCount())}>forwardRefDemo p </p>
            <hr />
            <Child title="我是title" ref={ChildRef}></Child>
        </div>
    )
}


export default ForwardRefDemo;