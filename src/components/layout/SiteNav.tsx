"use client"

import { Button } from "@ui-sdk/react/button"

import ProximityLink from "@/components/ui/ProximityLink"
import { EaseIn } from "@/components/animations/EaseIn"
import type { LinkItem } from "@/app/posts/menuItems"

type SiteNavProps = {
  readonly items: readonly LinkItem[]
  readonly className?: string
  readonly linkClassName?: string
  readonly prefix?: string
  readonly suffix?: string
  readonly delayMs?: number
  readonly delayStepMs?: number
}

export function SiteNav({
  items,
  className = "flex flex-col",
  linkClassName,
  prefix = "→ ",
  suffix,
  delayMs = 0,
  delayStepMs = 0
}: SiteNavProps) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <EaseIn
          key={`${item.name}-${item.href}`}
          from="right"
          delayMs={delayMs + index * delayStepMs}
        >
          <Button
            render={
              <ProximityLink href={item.href} className={linkClassName} />
            }
          >
            {prefix + item.name + (suffix ?? "")}
          </Button>
        </EaseIn>
      ))}
    </div>
  )
}
