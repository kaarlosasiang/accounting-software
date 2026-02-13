import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Button } from "../button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

function CollapsibleDemo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-80">
      <div className="flex items-center justify-between space-x-4">
        <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? "Collapse" : "Expand"}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 mt-4">
        <div className="px-4 py-2 font-mono text-sm border rounded">
          @radix-ui/primitives
        </div>
        <div className="px-4 py-2 font-mono text-sm border rounded">
          @emotion/react
        </div>
        <div className="px-4 py-2 font-mono text-sm border rounded">
          nxpkg
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const Default: Story = {
  render: () => <CollapsibleDemo />,
}
