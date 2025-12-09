import { useState, forwardRef, useImperativeHandle } from 'react'

type childRefType = {
    see: () => void,
    getCount: () => number
}

type propsType = {
    title?: string
}

const Child = forwardRef<childRefType, propsType>((props, ref) => {
    const [count, setCount] = useState(0)
    const see = () => {
        console.log('see');
    }
    useImperativeHandle(ref, () => ({
        see,
        getCount: () => count
    }), [count])
    return (
        <>
            <p>{props.title}</p>
            <p onClick={() => setCount(count + 1)}>Child : count is {count}...</p>

        </>
    )
})




export default Child;