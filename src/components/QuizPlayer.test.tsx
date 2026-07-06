import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { QuizPlayer } from "./QuizPlayer";
import type { Quiz } from "@/lib/types";

// next/link → plain anchor so we can render without a router. Forward extra
// props (e.g. aria-label) so accessible-name queries work.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const quiz: Quiz = {
  id: "test-id",
  slug: "test",
  title: "Test Quiz",
  question_count: 3,
  difficulty: "easy",
  questions: [
    { id: "1", prompt: "Q1?", options: ["A", "B", "C", "D"], correct_index: 1 },
    { id: "2", prompt: "Q2?", options: ["A", "B", "C", "D"], correct_index: 0 },
    { id: "3", prompt: "Q3?", options: ["A", "B", "C", "D"], correct_index: 2 },
  ],
  created_by: null,
  created_at: "",
  updated_at: "",
};

const ADVANCE = 2500;
// Only the answer buttons carry data-testid="option" — Back/Next/Home don't,
// so this stays stable as the surrounding controls change.
const optionButtons = () => screen.getAllByTestId("option");
const advance = () => act(() => void vi.advanceTimersByTime(ADVANCE));

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear(); // isolate persisted quiz progress between tests
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});

const setHidden = () => {
  Object.defineProperty(document, "visibilityState", {
    value: "hidden",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("QuizPlayer", () => {
  it("shows the first question and position", () => {
    render(<QuizPlayer quiz={quiz} />);
    expect(screen.getByText("Q 1/3")).toBeInTheDocument();
    expect(screen.getByText("Q1?")).toBeInTheDocument();
  });

  it("marks a correct pick green and disables the options", () => {
    render(<QuizPlayer quiz={quiz} />);
    const opts = optionButtons();
    fireEvent.click(opts[1]); // correct_index for Q1 is 1
    expect(opts[1].className).toContain("bg-green-600");
    opts.forEach((b) => expect(b).toBeDisabled());
  });

  it("marks a wrong pick red and still shows the correct answer green", () => {
    render(<QuizPlayer quiz={quiz} />);
    const opts = optionButtons();
    fireEvent.click(opts[0]); // wrong (correct is 1)
    expect(opts[0].className).toContain("bg-red-600");
    expect(opts[1].className).toContain("bg-green-600");
  });

  it("auto-advances to the next question after the delay", () => {
    render(<QuizPlayer quiz={quiz} />);
    fireEvent.click(optionButtons()[1]);
    expect(screen.queryByText("Q2?")).not.toBeInTheDocument(); // not yet
    advance();
    expect(screen.getByText("Q2?")).toBeInTheDocument();
    expect(screen.getByText("Q 2/3")).toBeInTheDocument();
  });

  it("scores all-correct and reaches the result screen with Retry/Home", () => {
    render(<QuizPlayer quiz={quiz} />);
    const correct = [1, 0, 2]; // matches the fixture
    for (const c of correct) {
      fireEvent.click(optionButtons()[c]);
      advance();
    }
    expect(screen.getByText("3/3")).toBeInTheDocument();
    // Perfect score earns the top-tier headline (low scores get a plain one).
    expect(screen.getByText("Outstanding!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });

  it("counts only correct answers", () => {
    render(<QuizPlayer quiz={quiz} />);
    const picks = [1, 1, 2]; // Q2 wrong (correct is 0) → 2/3
    for (const p of picks) {
      fireEvent.click(optionButtons()[p]);
      advance();
    }
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("retry resets back to the first question", () => {
    render(<QuizPlayer quiz={quiz} />);
    for (const c of [1, 0, 2]) {
      fireEvent.click(optionButtons()[c]);
      advance();
    }
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByText("Q 1/3")).toBeInTheDocument();
    expect(screen.getByText("Q1?")).toBeInTheDocument();
  });

  it("has a text Home link in the quiz header", () => {
    render(<QuizPlayer quiz={quiz} />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("backgrounding cancels auto-advance so you stay on the current question", () => {
    render(<QuizPlayer quiz={quiz} />);
    fireEvent.click(optionButtons()[1]); // answer Q1
    setHidden(); // app backgrounded before the 2.5s auto-advance fires
    advance(); // 2.5s elapses
    expect(screen.getByText("Q 1/3")).toBeInTheDocument(); // did not jump
    expect(screen.queryByText("Q2?")).not.toBeInTheDocument();
  });

  it("restores in-progress answers when remounted (e.g. after a PWA resume)", () => {
    const { unmount } = render(<QuizPlayer quiz={quiz} />);
    fireEvent.click(optionButtons()[0]); // Q1 wrong pick (correct is 1)
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Q 2/3")).toBeInTheDocument();
    unmount(); // simulate the web view being torn down and reloaded

    render(<QuizPlayer quiz={quiz} />);
    // Same question, and going Back shows the preserved Q1 answer.
    expect(screen.getByText("Q 2/3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(optionButtons()[0].className).toContain("bg-red-600");
    expect(optionButtons()[1].className).toContain("bg-green-600");
  });

  it("Next advances only after an answer, without waiting for auto-advance", () => {
    render(<QuizPlayer quiz={quiz} />);
    const next = () => screen.getByRole("button", { name: /Next/ });
    expect(next()).toBeDisabled(); // must answer first
    fireEvent.click(optionButtons()[1]);
    expect(next()).toBeEnabled();
    fireEvent.click(next()); // manual advance, no timer
    expect(screen.getByText("Q2?")).toBeInTheDocument();
    expect(screen.getByText("Q 2/3")).toBeInTheDocument();
  });

  it("Back returns to the previous question with its answer preserved", () => {
    render(<QuizPlayer quiz={quiz} />);
    // Q1 has nothing to go back to, so no Back button is shown at all.
    expect(
      screen.queryByRole("button", { name: "← Back" }),
    ).not.toBeInTheDocument();
    fireEvent.click(optionButtons()[0]); // Q1 wrong pick (correct is 1)
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    // Back on Q1: the wrong pick is still shown red, correct still green.
    expect(screen.getByText("Q1?")).toBeInTheDocument();
    expect(optionButtons()[0].className).toContain("bg-red-600");
    expect(optionButtons()[1].className).toContain("bg-green-600");
  });
});
