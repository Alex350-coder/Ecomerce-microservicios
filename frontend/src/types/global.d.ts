import { FunctionComponent } from 'react';

declare module './pages' {
  export const Home: FunctionComponent<any>;
  export const Login: FunctionComponent<any>;
  export const Register: FunctionComponent<any>;
  export const Account: FunctionComponent<any>;
  export const Checkout: FunctionComponent<any>;
  export const Products: FunctionComponent<any>;
  export {};
}

declare module './pages/FastLinks' {
  export const About: FunctionComponent<any>;
  export const Contact: FunctionComponent<any>;
  export const Support: FunctionComponent<any>;
  export {};
}

declare module './pages/Privacy' {
  export const Privacy: FunctionComponent<any>;
  export const Returns: FunctionComponent<any>;
  export const ReturnRequest: FunctionComponent<any>;
  export const Terms: FunctionComponent<any>;
  export {};
}

declare module '*.jsx' {
  import { ComponentType } from 'react';
  const Component: ComponentType<any>;
  export default Component;
}
