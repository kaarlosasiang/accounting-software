import type { Meta, StoryObj } from "@storybook/nextjs-vite"
const meta = { title: "UI/Item", tags: ["autodocs"] } satisfies Meta
export default meta
export const Default: Story = { render: () => <div>Item</div> } as StoryObj
