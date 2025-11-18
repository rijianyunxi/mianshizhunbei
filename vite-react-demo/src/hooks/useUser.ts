import { useState,useEffect } from 'react'

const getUser = (): Promise<{name: string, age: number}> => {
    return new Promise((resolve) => {
        setTimeout(()=>{
            resolve({
                name: 'song',
                age: 18
            })
        },2000)
    })
}



function useUser() {
    const [info, setInfo] = useState({
        name: '',
        age: 0
    })
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getUser().then((res) => {
            setInfo(res);
            setLoading(false);
        })
    }, [])
    return {loading, info};
}

export default useUser;