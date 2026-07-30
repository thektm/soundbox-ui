export type AuthPromptReason = {
  title?: string;
  description?: string;
};

export function openAuthPrompt(reason?: string | AuthPromptReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("sedabox:auth-required", {
      detail: reason,
    }),
  );
}
