import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    className: "w-64",
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    className: "h-20",
  },
};

export const WithText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Radix Primitives</h4>
        <p className="text-xs text-muted-foreground">
          An open-source UI component library.
        </p>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Colors</h4>
        <p className="text-xs text-muted-foreground">
          10 color options at 9 luminance levels each.
        </p>
      </div>
    </div>
  ),
};
