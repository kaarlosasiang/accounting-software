import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Progress } from "./progress"

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 65,
    className: "w-full max-w-xs",
  },
}

export const Values: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-xs">
      <div>
        <p className="text-sm mb-2">25%</p>
        <Progress value={25} />
      </div>
      <div>
        <p className="text-sm mb-2">50%</p>
        <Progress value={50} />
      </div>
      <div>
        <p className="text-sm mb-2">75%</p>
        <Progress value={75} />
      </div>
      <div>
        <p className="text-sm mb-2">100%</p>
        <Progress value={100} />
      </div>
    </div>
  ),
}
