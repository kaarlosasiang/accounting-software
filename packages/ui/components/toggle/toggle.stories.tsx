import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Toggle } from "./toggle"

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "outline"],
    },
    size: {
      control: { type: "select" },
      options: ["default", "sm", "lg"],
    },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: "Toggle",
  },
}

export const Outline: Story = {
  args: {
    children: "Toggle",
    variant: "outline",
  },
}

export const Pressed: Story = {
  args: {
    children: "Toggled",
    pressed: true,
  },
}
