/// <reference types="vite/client" />

declare module 'simplebar-react' {
  import { ComponentType, ReactNode } from 'react';
  
  interface SimpleBarProps {
    children: ReactNode;
    style?: React.CSSProperties;
    forceVisible?: 'x' | 'y' | boolean;
    autoHide?: boolean;
    scrollableNodeProps?: object;
    [key: string]: any;
  }
  
  const SimpleBar: ComponentType<SimpleBarProps>;
  export default SimpleBar;
}
