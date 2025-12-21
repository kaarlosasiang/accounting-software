import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Spinner } from "./spinner"

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Large: Story = {
  args: {
    className: "size-8",
  },
}

export const Small: Story = {
  args: {
    className: "size-3",
  },
}
