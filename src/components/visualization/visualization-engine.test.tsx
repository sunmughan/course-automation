import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryView } from "./memory-view";
import { CallStack } from "./call-stack";
import { ExecutionTimeline } from "./execution-timeline";
import { AsyncVisualizer } from "./async-visualizer";
import type { ExecutionEvent, AsyncTrace } from "@/types";

describe("Wave 6: Visualization Engine", () => {
  describe("MemoryView Component", () => {
    it("renders stack and heap variables from canonical execution events", () => {
      const canonicalEvents: ExecutionEvent[] = [
        {
          sequence: 0,
          type: "PROGRAM_START",
          line: 1,
        },
        {
          sequence: 1,
          type: "VARIABLE_DECLARE",
          variable: "score",
          value: 100,
          line: 2,
        },
        {
          sequence: 2,
          type: "OBJECT_CREATE",
          variable: "user",
          value: { name: "Alex", role: "admin" },
          line: 3,
        },
        {
          sequence: 3,
          type: "VARIABLE_ASSIGN",
          variable: "score",
          value: 150,
          line: 4,
          payload: { name: "score", value: 150, previousValue: 100 },
        },
      ];

      render(<MemoryView events={canonicalEvents} currentStep={3} />);

      // Stack variable
      expect(screen.getByText("score")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("(was 100)")).toBeInTheDocument();

      // Heap variable
      expect(screen.getByText("user")).toBeInTheDocument();
      expect(screen.getByText(/Alex/)).toBeInTheDocument();
      expect(screen.getByText("Heap")).toBeInTheDocument();
    });

    it("prioritizes state snapshot when available", () => {
      const eventsWithSnapshot: ExecutionEvent[] = [
        {
          sequence: 0,
          type: "LINE_EXECUTED",
          line: 5,
          snapshot: [
            {
              name: "items",
              value: [1, 2, 3],
              type: "array",
              scope: "global",
              changed: true,
            },
          ],
        },
      ];

      render(<MemoryView events={eventsWithSnapshot} currentStep={0} />);

      expect(screen.getByText("items")).toBeInTheDocument();
      expect(screen.getByText(/\[1,2,3\]/)).toBeInTheDocument();
    });

    it("displays legitimate empty state when no variables are present", () => {
      render(<MemoryView events={[]} currentStep={0} />);

      expect(screen.getByText("No variables in memory")).toBeInTheDocument();
    });
  });

  describe("CallStack Component", () => {
    it("renders active stack frames from canonical FUNCTION_CALL and CALLSTACK_PUSH events", () => {
      const callEvents: ExecutionEvent[] = [
        {
          sequence: 0,
          type: "PROGRAM_START",
          line: 1,
          callStack: [],
        },
        {
          sequence: 1,
          type: "FUNCTION_CALL",
          variable: "calculateTotal",
          payload: { name: "calculateTotal", args: [10, 20] },
          line: 2,
          callStack: ["calculateTotal"],
        },
        {
          sequence: 2,
          type: "FUNCTION_CALL",
          variable: "applyDiscount",
          payload: { name: "applyDiscount", args: [30] },
          line: 3,
          callStack: ["calculateTotal", "applyDiscount"],
        },
      ];

      render(<CallStack events={callEvents} currentStep={2} />);

      expect(screen.getByText("calculateTotal")).toBeInTheDocument();
      expect(screen.getByText("applyDiscount")).toBeInTheDocument();
      expect(screen.getByText("(10, 20)")).toBeInTheDocument();
      expect(screen.getByText("(30)")).toBeInTheDocument();
      expect(screen.getByText("2 frames on the stack")).toBeInTheDocument();
      expect(screen.getByText("Executing...")).toBeInTheDocument();
    });

    it("displays empty state when call stack is empty", () => {
      render(<CallStack events={[]} currentStep={0} />);

      expect(screen.getByText("Call stack is empty")).toBeInTheDocument();
    });
  });

  describe("ExecutionTimeline Component & Controls", () => {
    it("renders all canonical event types in sequence with labels", () => {
      const events: ExecutionEvent[] = [
        { sequence: 0, type: "PROGRAM_START", line: 1 },
        { sequence: 1, type: "LOOP_START", line: 2, payload: { message: "Loop started" } },
        { sequence: 2, type: "LOOP_ITERATION", line: 3, payload: { iteration: 0 } },
        { sequence: 3, type: "CONDITION_CHECK", line: 4, payload: { condition: "i < 3", result: true } },
        { sequence: 4, type: "OUTPUT", line: 5, payload: { message: "Console output 0" } },
        { sequence: 5, type: "LOOP_END", line: 6, payload: { message: "Loop ended" } },
        { sequence: 6, type: "PROGRAM_END", line: 7 },
      ];

      const onStepChange = vi.fn();
      render(<ExecutionTimeline events={events} onStepChange={onStepChange} />);

      expect(screen.getByText("Execution Timeline")).toBeInTheDocument();
      expect(screen.getByText("Step 1 / 7")).toBeInTheDocument();
      expect(screen.getByText("Loop Start")).toBeInTheDocument();
      expect(screen.getByText("Loop Step")).toBeInTheDocument();
      expect(screen.getByText("Condition")).toBeInTheDocument();
      expect(screen.getByText("Iteration 0")).toBeInTheDocument();
      expect(screen.getByText("Console output 0")).toBeInTheDocument();
    });

    it("supports Step Forward, Step Backward, and Jump to End controls", () => {
      const events: ExecutionEvent[] = [
        { sequence: 0, type: "PROGRAM_START", line: 1 },
        { sequence: 1, type: "VARIABLE_DECLARE", variable: "x", value: 1, line: 2 },
        { sequence: 2, type: "PROGRAM_END", line: 3 },
      ];

      const onStepChange = vi.fn();
      render(<ExecutionTimeline events={events} onStepChange={onStepChange} />);

      // Click Next step button
      const nextBtn = screen.getByTitle("Next step");
      fireEvent.click(nextBtn);
      expect(onStepChange).toHaveBeenCalledWith(1);

      // Click Jump to end button
      const endBtn = screen.getByTitle("Jump to end");
      fireEvent.click(endBtn);
      expect(onStepChange).toHaveBeenCalledWith(2);

      // Click Reset button
      const resetBtn = screen.getByTitle("Reset");
      fireEvent.click(resetBtn);
      expect(onStepChange).toHaveBeenCalledWith(0);
    });

    it("allows adjusting playback speed", () => {
      const events: ExecutionEvent[] = [
        { sequence: 0, type: "PROGRAM_START", line: 1 },
        { sequence: 1, type: "PROGRAM_END", line: 2 },
      ];

      render(<ExecutionTimeline events={events} />);

      const speed2x = screen.getByTitle("Playback speed 2x");
      fireEvent.click(speed2x);
      expect(speed2x).toHaveClass("bg-primary");
    });

    it("shows empty state when no events are provided", () => {
      render(<ExecutionTimeline events={[]} />);

      expect(screen.getByText("No execution trace available")).toBeInTheDocument();
    });
  });

  describe("AsyncVisualizer Component", () => {
    it("renders canonical async events with timing", () => {
      const trace: AsyncTrace = {
        events: [
          {
            id: "async-1",
            type: "ASYNC_START",
            timestamp: 100,
            description: "Fetch user profile",
            duration: 50,
          },
          {
            id: "async-2",
            type: "ASYNC_RESUME",
            timestamp: 150,
            description: "Profile loaded",
          },
        ],
        summary: {
          totalPromises: 1,
          totalTimeouts: 0,
          microtasks: 1,
          macrotasks: 0,
          unhandledRejections: 0,
        },
        timeline: [],
      };

      render(<AsyncVisualizer trace={trace} />);

      expect(screen.getByText("Async Trace")).toBeInTheDocument();
      expect(screen.getByText("1 promises")).toBeInTheDocument();
      expect(screen.getByText("Fetch user profile")).toBeInTheDocument();
      expect(screen.getByText("50ms")).toBeInTheDocument();
      expect(screen.getByText("Profile loaded")).toBeInTheDocument();
    });

    it("shows empty state when no async events exist", () => {
      const emptyTrace: AsyncTrace = {
        events: [],
        summary: {
          totalPromises: 0,
          totalTimeouts: 0,
          microtasks: 0,
          macrotasks: 0,
          unhandledRejections: 0,
        },
        timeline: [],
      };

      render(<AsyncVisualizer trace={emptyTrace} />);

      expect(screen.getByText("No async events in trace")).toBeInTheDocument();
    });
  });
});
