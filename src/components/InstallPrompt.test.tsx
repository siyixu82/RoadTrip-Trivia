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

  it("shows the Share → Add to Home Screen hint on iOS Safari", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    render(<InstallPrompt />);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
    // No native Install button on iOS.
    expect(screen.queryByRole("button", { name: /^install$/i })).toBeNull();
    // Safari path doesn't tell you to switch browsers.
    expect(screen.queryByText(/open this page in/i)).toBeNull();
  });

  it("tells iOS Chrome to open in Safari", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1",
    });
    render(<InstallPrompt />);
    expect(screen.getByText(/open this page in/i)).toBeInTheDocument();
    expect(screen.getByText(/safari/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^install$/i })).toBeNull();
  });
});
