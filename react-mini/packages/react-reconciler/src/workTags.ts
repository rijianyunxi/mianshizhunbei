
export type WorkTag =
    | typeof HostComponent
    | typeof FunctionComponent
    | typeof HostRoot
    | typeof HostText
    | typeof HostPortal;

export const FunctionComponent = 0;

export const HostRoot = 3;

export const HostComponent = 5;

export const HostText = 6;

export const HostPortal = 7;

