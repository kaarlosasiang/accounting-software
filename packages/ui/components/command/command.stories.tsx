import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = { title: "UI/Command", tags: ["autodocs"] } satisfies Meta

export default meta

export const Default: Story = {
  render: () => <div>Command component</div>,
} as StoryObj
