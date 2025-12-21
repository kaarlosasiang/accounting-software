import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./resizable";

const meta = {
  title: "UI/Resizable",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function PanelBox({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-md bg-muted text-sm">
      {label}
    </div>
  );
}

export const Horizontal: Story = {
  name: "Horizontal split",
  render: () => (
    <div className="h-64 w-full">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={50} minSize={20}>
          <PanelBox label="Left" />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={20}>
          <PanelBox label="Right" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Vertical: Story = {
  name: "Vertical split",
  render: () => (
    <div className="h-64 w-full">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={50} minSize={20}>
          <PanelBox label="Top" />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={20}>
          <PanelBox label="Bottom" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const ThreePanels: Story = {
  name: "Three panels",
  render: () => (
    <div className="h-64 w-full">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={33} minSize={15}>
          <PanelBox label="One" />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={34} minSize={15}>
          <PanelBox label="Two" />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={33} minSize={15}>
          <PanelBox label="Three" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
