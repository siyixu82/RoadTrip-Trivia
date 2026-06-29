import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { QuizPlayer } from "./QuizPlayer";
import type { Quiz } from "@/lib/types";

// next/link → plain anchor so we can render without a router.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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

const ADVANCE = 1100;
const optionButtons = () => screen.getAllByRole("button");
const advance = () => act(() => void vi.advanceTimersByTime(ADVANCE));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

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
    expect(screen.getByText("Quiz complete!")).toBeInTheDocument();
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
});
