declare module './pages' {
  import { FunctionComponent } from 'react';
  export const Home: FunctionComponent<any>;
  export const Login: FunctionComponent<any>;
  export const Register: FunctionComponent<any>;
  export const Account: FunctionComponent<any>;
  export const Checkout: FunctionComponent<any>;
  export const Products: FunctionComponent<any>;
}

declare module './pages/FastLinks' {
  import { FunctionComponent } from 'react';
  export const About: FunctionComponent<any>;
  export const Contact: FunctionComponent<any>;
  export const Support: FunctionComponent<any>;
}

declare module './pages/Privacy' {
  import { FunctionComponent } from 'react';
  export const Privacy: FunctionComponent<any>;
  export const Returns: FunctionComponent<any>;
  export const ReturnRequest: FunctionComponent<any>;
  export const Terms: FunctionComponent<any>;
}

declare module '*.jsx' {
  import { ComponentType } from 'react';
  const Component: ComponentType<any>;
  export default Component;
}
