import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { InstallPrompt } from "./InstallPrompt";

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: "Mozilla/5.0 (Linux; Android 13)",
  });
  // jsdom lacks matchMedia; default to "not standalone".
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function fireBeforeInstall() {
  const e = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  e.prompt = vi.fn().mockResolvedValue(undefined);
  e.userChoice = Promise.resolve({ outcome: "accepted" });
  act(() => {
    window.dispatchEvent(e);
  });
  return e;
}

describe("InstallPrompt", () => {
  it("stays hidden until beforeinstallprompt fires (Android)", () => {
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();

    fireBeforeInstall();
    expect(screen.getByText(/install roadtrip trivia/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^install$/i })).toBeInTheDocument();
  });

  it("triggers the native prompt and hides on install", async () => {
    render(<InstallPrompt />);
    const e = fireBeforeInstall();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^install$/i }));
    });

    expect(e.prompt).toHaveBeenCalled();
    expect(screen.queryByText(/install roadtrip trivia/i)).toBeNull();
    expect(localStorage.getItem("rtt-install-dismissed")).toBe("1");
  });

  it("stays dismissed across mounts", () => {
    const { unmount } = render(<InstallPrompt />);
    fireBeforeInstall();
    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }));
    expect(screen.queryByText(/install roadtrip trivia/i)).toBeNull();
    unmount();

    render(<InstallPrompt />);
    fireBeforeInstall();
    expect(screen.queryByText(/install roadtrip trivia/i)).toBeNull();
  });

  it("shows the manual Add to Home Screen hint on iOS", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    });
    render(<InstallPrompt />);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
    // No native Install button on iOS.
    expect(screen.queryByRole("button", { name: /^install$/i })).toBeNull();
  });
});
