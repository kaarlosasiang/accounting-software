import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Checkbox } from "./checkbox"

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    disabled: false,
  },
}

export const Checked: Story = {
  args: {
    checked: true,
    disabled: false,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
  },
}
