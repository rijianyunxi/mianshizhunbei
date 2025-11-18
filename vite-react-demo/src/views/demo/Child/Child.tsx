import type { FC } from "react"
import styles from './child.module.scss'
import { useEffect } from "react"

type propsType = {
    count?: number
}

const Child: FC<propsType> = (props) => {
    console.log('Child 执行了...')

    useEffect(() => {
        console.log('Child useEffect 执行了...');

        return () => {
            console.log('Child useEffect return 执行了...');
        }
    }, [])

    return <>
        <hr />
        <h2 className={props.count ? styles.green : styles.red}>Child count is : <span className={styles.child}>{props.count}</span></h2>
    </>
}

export default Child;