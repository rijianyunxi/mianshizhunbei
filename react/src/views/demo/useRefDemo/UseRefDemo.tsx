import type { FC } from 'react';

import { useRef,useState } from 'react';

const UseRefDemo:FC = ()=>{
    console.log('UseRefDemo执行了...');
    
    const [value, setValue] = useState('');
    const ref = useRef<HTMLInputElement>(null);
    
    return (
        <>
            <input ref={ref} type="text" placeholder="hello ref...." value={value} onInput={(e:React.ChangeEvent<HTMLInputElement>)=>setValue(e.target.value)}></input>
        </>
    )   
}


export default UseRefDemo;
