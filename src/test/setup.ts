// Enables React's act() testing behavior in the environment.
// See https://react.dev/reference/react/act#environment-support
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

