import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number", "date", "file"],
    },
    placeholder: {
      control: { type: "text" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    type: "text",
  },
}

export const Email: Story = {
  args: {
    placeholder: "Enter your email",
    type: "email",
  },
}

export const Password: Story = {
  args: {
    placeholder: "Enter password",
    type: "password",
  },
}

export const Number: Story = {
  args: {
    placeholder: "Enter a number",
    type: "number",
  },
}

export const Date: Story = {
  args: {
    type: "date",
  },
}

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
}

export const WithValue: Story = {
  args: {
    type: "text",
    value: "Sample text",
    readOnly: true,
  },
}
