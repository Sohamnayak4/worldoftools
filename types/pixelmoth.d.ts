// The Pixelmoth analytics script sets window.pixelmoth. It may be blocked,
// so always call it with optional chaining: window.pixelmoth?.(...).
export {};

declare global {
  interface Window {
    pixelmoth?: ((
      cmd: "goal" | "identify" | "pageview",
      a?: unknown,
      b?: unknown,
    ) => void) & {
      attribution?: () => { pm_visitor_id?: string; pm_session_id?: string };
    };
  }
}
