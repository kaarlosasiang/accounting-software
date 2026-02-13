import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Kbd } from "./kbd"

const meta = {
  title: "UI/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Kbd>⌘K</Kbd>,
}

export const Multiple: Story = {
  render: () => (
    <div className="flex gap-2">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </div>
  ),
}
