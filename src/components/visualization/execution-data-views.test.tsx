import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeOutput } from "@/components/editor/code-output";
import { CallStack } from "@/components/visualization/call-stack";
import { MemoryView } from "@/components/visualization/memory-view";
import type { ExecutionEvent } from "@/types";

const events: ExecutionEvent[] = [
  {
    step: 0,
    type: "variable_declaration",
    variable: "count",
    value: 1,
    line: 1,
    callStack: [],
  },
  {
    step: 1,
    type: "function_call",
    variable: "increment",
    line: 2,
    callStack: ["increment"],
  },
  {
    step: 2,
    type: "assignment",
    variable: "count",
    value: 2,
    line: 3,
    callStack: ["increment"],
  },
  {
    step: 3,
    type: "function_return",
    variable: "increment",
    value: 2,
    line: 4,
    callStack: [],
  },
];

describe("MemoryView", () => {
  it("renders declarations and assignments from normalized execution events", () => {
    render(<MemoryView events={events} currentStep={2} />);

    expect(screen.getByText("count")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("(was 1)")).toBeInTheDocument();
  });
});

describe("CallStack", () => {
  it("renders the active stack from the current execution event", () => {
    render(<CallStack events={events} currentStep={2} />);

    expect(screen.getByText("increment")).toBeInTheDocument();
    expect(screen.getByText("Ln 2")).toBeInTheDocument();
    expect(screen.getByText("1 frame on the stack")).toBeInTheDocument();
  });

  it("is empty after the function return event", () => {
    render(<CallStack events={events} currentStep={3} />);

    expect(screen.getByText("Call stack is empty")).toBeInTheDocument();
  });
});

describe("CodeOutput live data tabs", () => {
  it("shows memory and call stack tabs backed by the latest execution event", () => {
    render(
      <CodeOutput
        output=""
        error={null}
        events={events}
        loading={false}
        executionTime={12}
      />
    );

    expect(screen.getByRole("tab", { name: "Memory" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Call Stack" })).toBeInTheDocument();
  });

  it("updates live memory and call stack data when events arrive", async () => {
    const { rerender } = render(
      <CodeOutput
        output=""
        error={null}
        events={events.slice(0, 2)}
        loading={true}
        executionTime={0}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: "Memory" }));
    expect(await screen.findByText("count")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Call Stack" }));
    expect(await screen.findByText("increment")).toBeInTheDocument();

    rerender(
      <CodeOutput
        output=""
        error={null}
        events={events}
        loading={false}
        executionTime={12}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: "Memory" }));
    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("(was 1)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Call Stack" }));
    expect(await screen.findByText("Call stack is empty")).toBeInTheDocument();
  });
});
