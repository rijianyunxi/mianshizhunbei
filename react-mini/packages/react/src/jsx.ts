import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import type { Type, Key, Ref, Props, ReactElement, ElementType } from 'shared/ReactTypes';
const ReactElement = function (type: Type, key: Key, ref: Ref, props: Props): ReactElement {
    const element = {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props,
        __mark: 'react.element_by_song'
    }

    return element;
}


export const jsx = (type: ElementType, config: any, ...maybeChildren: any): ElementType => {
    let key: Key = null;
    let ref: Ref = null;
    const props: Props = {};

    for (let prop in config) {
        const value = config[prop];
        if (prop === 'key') {
            if (value !== undefined) {
                key = '' + value;
            }
            continue;
        }
        if (prop === 'ref') {
            if (value !== undefined) {
                ref = value;
            }
            continue;
        }

        if ({}.hasOwnProperty.call(config, prop)) {
            props[prop] = value;
        }
    }

    const childrenLength = maybeChildren.length;
    if (childrenLength) {
        props.children = maybeChildren.length === 1 ? maybeChildren[0] : maybeChildren;
    }
    return ReactElement(type, key, ref, props);
}

export const jsxDev = jsx;