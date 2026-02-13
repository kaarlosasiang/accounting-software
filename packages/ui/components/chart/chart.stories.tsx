import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "UI/Chart",
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <div>Chart component</div>,
}
