import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"

const meta = {
  title: "UI/HoverCard",
  component: HoverCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>Hover over me</HoverCardTrigger>
      <HoverCardContent>
        <p>This is the hover card content that appears on hover.</p>
      </HoverCardContent>
    </HoverCard>
  ),
}

export const WithProfile: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer underline">
        @username
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">User Name</h4>
            <p className="text-sm text-muted-foreground">
              Web developer and open source enthusiast.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}
