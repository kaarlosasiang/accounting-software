import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "UI/Carousel",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <div>Carousel component - see source code</div>,
}
