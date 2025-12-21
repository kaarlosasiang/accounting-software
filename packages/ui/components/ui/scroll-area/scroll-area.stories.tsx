import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ScrollArea } from "./scroll-area"

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.${a.length - i}`
)

export const Default: Story = {
  render: () => (
    <ScrollArea className="w-48 h-72 rounded-md border p-4">
      <div className="space-y-4">
        {tags.map((tag) => (
          <div key={tag} className="text-sm">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 h-48 rounded-md border whitespace-nowrap p-4">
      <div className="flex space-x-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-32 h-32 bg-primary rounded flex items-center justify-center"
          >
            <span className="text-white font-bold">{i + 1}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
