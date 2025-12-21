import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AspectRatio } from "./aspect-ratio"

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

export const SixteenToNine: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="bg-accent w-[300px]">
      <img
        src="https://images.unsplash.com/photo-1579353977991-127f194a5e86"
        alt="Image"
        className="h-full w-full object-cover rounded"
      />
    </AspectRatio>
  ),
}

export const Square: Story = {
  render: () => (
    <AspectRatio ratio={1 / 1} className="bg-accent w-[200px]">
      <img
        src="https://images.unsplash.com/photo-1579353977991-127f194a5e86"
        alt="Image"
        className="h-full w-full object-cover rounded"
      />
    </AspectRatio>
  ),
}
