const supportedSymbol = typeof Symbol === 'function' ? Symbol.for('react.element') : 0xeac7;

export const REACT_ELEMENT_TYPE = supportedSymbol;