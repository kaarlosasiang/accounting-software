import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../button"

const meta = {
  title: "UI/Empty",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex items-center justify-center p-8 border rounded">
      <div className="text-center">
        <h3 className="font-semibold">No items</h3>
        <p className="text-muted-foreground text-sm">Get started by creating your first item</p>
        <Button className="mt-4">Create Item</Button>
      </div>
    </div>
  ),
}
