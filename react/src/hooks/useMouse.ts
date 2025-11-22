import { useEffect, useState } from 'react'


function useMouse() {
    const [mouse, setMouse] = useState({
        x: 0,
        y: 0
    })
    useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            setMouse({
                x: e.clientX,
                y: e.clientY
            })
        }
        window.addEventListener('mousemove', mouseMove)
        return () => {
            window.removeEventListener('mousemove', mouseMove)
        }
    }, [mouse])
    return mouse;
}


export default useMouse;