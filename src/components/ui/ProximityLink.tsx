"use client"

import "./proximity-link.css"
import NextLink from "next/link"
import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react"
import type { AnchorHTMLAttributes, MutableRefObject } from "react"
import ProximityShadowText, {
  setProximityShadowPointerPosition
} from "./ProximityShadowText"
import { defaultShadowTuning } from "./proximityLinkMath"
import type { FalloffMode, ProximityShadowTuning } from "./proximityLinkMath"
import { isExternalHref } from "@/lib/utils"

export interface ProximityLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children"
> {
  href: string
  children?: string
  label?: string
  fromFontVariationSettings?: string
  toFontVariationSettings?: string
  radius?: number
  falloff?: FalloffMode
  shadowColor?: string
  allowShadowYFollow?: boolean
  reverseShadowDirection?: boolean
  reverseShadowNearStronger?: boolean
  shadowTuning?: Partial<ProximityShadowTuning>
}

const DEFAULT_PROXIMITY_LINK_PROPS = {
  fromFontVariationSettings: "'wght' 300",
  toFontVariationSettings: "'wght' 900",
  radius: 256,
  falloff: "exponential" as FalloffMode,
  shadowColor: "var(--color-magenta)",
  allowShadowYFollow: false,
  reverseShadowDirection: true,
  reverseShadowNearStronger: true
}

function ProximityLink({
  href,
  children,
  label,
  fromFontVariationSettings = DEFAULT_PROXIMITY_LINK_PROPS.fromFontVariationSettings,
  toFontVariationSettings = DEFAULT_PROXIMITY_LINK_PROPS.toFontVariationSettings,
  radius = DEFAULT_PROXIMITY_LINK_PROPS.radius,
  falloff = DEFAULT_PROXIMITY_LINK_PROPS.falloff,
  shadowColor = DEFAULT_PROXIMITY_LINK_PROPS.shadowColor,
  allowShadowYFollow = DEFAULT_PROXIMITY_LINK_PROPS.allowShadowYFollow,
  reverseShadowDirection = DEFAULT_PROXIMITY_LINK_PROPS.reverseShadowDirection,
  reverseShadowNearStronger = DEFAULT_PROXIMITY_LINK_PROPS.reverseShadowNearStronger,
  shadowTuning,
  className = "",
  onMouseEnter,
  onMouseLeave,
  ...props
}: ProximityLinkProps) {
  const { ref: forwardedRef, ...forwardedProps } = props as typeof props & {
    ref?:
      | ((node: HTMLAnchorElement | null) => void)
      | { current: HTMLAnchorElement | null }
  }
  const text = children ?? label
  if (!text) {
    throw new Error("ProximityLink requires either children or label prop")
  }

  const containerRef = useRef<HTMLAnchorElement | null>(null)
  const forwardedRefRef = useRef(forwardedRef)

  useLayoutEffect(() => {
    forwardedRefRef.current = forwardedRef
  }, [forwardedRef])

  const setContainerRef = useCallback((node: HTMLAnchorElement | null) => {
    containerRef.current = node
    const target = forwardedRefRef.current
    if (typeof target === "function") {
      target(node)
    } else if (target) {
      target.current = node
    }
  }, [])
  const isHoveredRef = useRef(false)
  const resolvedShadowTuning = useMemo(
    () => ({ ...defaultShadowTuning, ...shadowTuning }),
    [shadowTuning]
  )
  const isExternal = isExternalHref(href)
  const linkClass = `proximity-link ${className}`

  const proximityContent = (
    <ProximityShadowText
      label={text}
      containerRef={containerRef as MutableRefObject<HTMLElement | null>}
      fromFontVariationSettings={fromFontVariationSettings}
      toFontVariationSettings={toFontVariationSettings}
      radius={radius}
      falloff={falloff}
      hoverRef={isHoveredRef}
      shadowColor={shadowColor}
      allowShadowYFollow={allowShadowYFollow}
      reverseShadowDirection={reverseShadowDirection}
      reverseShadowNearStronger={reverseShadowNearStronger}
      shadowTuning={resolvedShadowTuning}
    />
  )

  const handleMouseEnter: ProximityLinkProps["onMouseEnter"] = (event) => {
    setProximityShadowPointerPosition(event.clientX, event.clientY)
    isHoveredRef.current = true
    onMouseEnter?.(event)
  }

  const handleMouseLeave: ProximityLinkProps["onMouseLeave"] = (event) => {
    setProximityShadowPointerPosition(event.clientX, event.clientY)
    isHoveredRef.current = false
    onMouseLeave?.(event)
  }

  if (isExternal) {
    return (
      <a
        ref={setContainerRef}
        href={href}
        className={linkClass}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...forwardedProps}
      >
        {proximityContent}
      </a>
    )
  }

  return (
    <NextLink
      ref={setContainerRef}
      href={href}
      className={linkClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...forwardedProps}
    >
      {proximityContent}
    </NextLink>
  )
}

export default memo(ProximityLink)
