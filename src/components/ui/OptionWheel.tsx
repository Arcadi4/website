"use client"

import {
  type CSSProperties,
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { Listbox, ListboxItem } from "@ui-sdk/react/listbox"
import { cn } from "@/lib/utils"

interface OptionWheelProps {
  readonly items: readonly string[]
  readonly selectedIndex: number
  readonly onItemClick?: (index: number, item: string) => void
  readonly textColor?: string
  readonly activeColor?: string
  readonly fontSize?: number
  readonly spacing?: number
  readonly tilt?: number
  readonly fade?: number
  readonly blur?: number
  readonly xPadding?: number
  readonly smoothing?: number
  readonly className?: string
}

type DragState = {
  readonly pointerId: number
  readonly startY: number
  readonly startPosition: number
}

type WheelState = {
  count: number
  rowHeight: number
  smoothing: number
  tilt: number
  fade: number
  blur: number
}

const MIN_OPACITY = 0.08
const MAX_TILT_ANGLE = Math.PI / 2
// Bold base: font = usable / (len * 0.54) * 0.96
const BOLD_AVG = 0.54
const SHRINK = 0.96
const MIN_PX = 8
const MAX_PX = 32

function clamp(value: number, count: number) {
  return Math.min(Math.max(value, 0), Math.max(count - 1, 0))
}

export default function OptionWheel({
  items,
  selectedIndex,
  onItemClick,
  textColor = "#a6a6a6",
  activeColor = "#ffffff",
  fontSize,
  spacing = 1,
  tilt = 0,
  fade = 0.25,
  blur = 1,
  xPadding = 0,
  smoothing = 160,
  className = ""
}: OptionWheelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const positionRef = useRef(clamp(selectedIndex, items.length))
  const targetRef = useRef(clamp(selectedIndex, items.length))
  const animationFrameRef = useRef<number | undefined>(undefined)
  const wheelSnapTimeoutRef = useRef<number | undefined>(undefined)
  const lastFrameRef = useRef<number | undefined>(undefined)
  const dragRef = useRef<DragState | undefined>(undefined)
  const suppressClickRef = useRef(false)
  const onItemClickRef = useRef(onItemClick)
  const longest = useMemo(() => {
    let max = 0
    for (const item of items) max = Math.max(max, item.length)
    return Math.max(max, 1)
  }, [items])
  const hasAuto = fontSize === undefined
  const explicitFontPx = fontSize ?? 16
  const autoFontSizeValue = `clamp(${MIN_PX}px, calc((100cqi - 2 * var(--ow-x-padding)) / var(--ow-longest) / ${BOLD_AVG} * ${SHRINK}), ${MAX_PX}px)`

  const [dragging, setDragging] = useState(false)

  const stateRef = useRef<WheelState>({
    count: items.length,
    rowHeight: hasAuto
      ? Math.max(16 * spacing, 1)
      : Math.max(explicitFontPx * 16 * spacing, 1),
    smoothing,
    tilt,
    fade,
    blur
  })

  const setTarget = useCallback((position: number, snap = false) => {
    const next = snap ? Math.round(position) : position
    targetRef.current = clamp(next, stateRef.current.count)
  }, [])
  useLayoutEffect(() => {
    targetRef.current = clamp(selectedIndex, items.length)
    onItemClickRef.current = onItemClick
    const state = stateRef.current
    state.count = items.length
    state.smoothing = smoothing
    state.tilt = tilt
    state.fade = fade
    state.blur = blur
    if (!hasAuto) {
      state.rowHeight = Math.max(explicitFontPx * 16 * spacing, 1)
    }
  }, [
    items.length,
    selectedIndex,
    onItemClick,
    smoothing,
    tilt,
    fade,
    blur,
    hasAuto,
    explicitFontPx,
    spacing
  ])

  useLayoutEffect(() => {
    if (!hasAuto) return
    const inner = innerRef.current
    if (!inner) return
    const updateRowHeight = () => {
      const px = Number.parseFloat(getComputedStyle(inner).fontSize)
      if (Number.isFinite(px) && px > 0) {
        const next = Math.max(px * spacing, 1)
        if (Math.abs(stateRef.current.rowHeight - next) > 0.05) {
          stateRef.current.rowHeight = next
        }
      }
    }
    updateRowHeight()
    const observer = new ResizeObserver(updateRowHeight)
    observer.observe(inner)
    const root = rootRef.current
    if (root) observer.observe(root)
    window.addEventListener("resize", updateRowHeight)
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) updateRowHeight()
    })
    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener("resize", updateRowHeight)
    }
  }, [hasAuto, spacing, longest])

  useEffect(() => {
    const render = (now: number) => {
      const state = stateRef.current
      const elapsed = Math.min(
        (now - (lastFrameRef.current ?? now)) / 1000,
        0.05
      )
      lastFrameRef.current = now

      const interpolation =
        1 - Math.exp(-elapsed / (Math.max(state.smoothing, 1) / 1000))
      const target = clamp(targetRef.current, state.count)
      const next =
        positionRef.current + (target - positionRef.current) * interpolation
      positionRef.current = Math.abs(target - next) < 0.001 ? target : next

      const tiltRadians = (state.tilt * Math.PI) / 180
      const radius = tiltRadians > 0.0005 ? state.rowHeight / tiltRadians : 0
      for (let index = 0; index < state.count; index += 1) {
        const element = itemRefs.current[index]
        if (!element) continue

        const distance = index - positionRef.current
        const absoluteDistance = Math.abs(distance)
        const angle = Math.max(
          -MAX_TILT_ANGLE,
          Math.min(MAX_TILT_ANGLE, distance * tiltRadians)
        )
        const y = radius ? radius * Math.sin(angle) : distance * state.rowHeight
        const x = radius ? -radius * (1 - Math.cos(angle)) : 0
        const rotation = radius ? (angle * 180) / Math.PI : 0

        element.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(2)}deg)`
        element.style.opacity = String(
          Math.max(MIN_OPACITY, 1 - absoluteDistance * state.fade)
        )
        element.style.filter = `blur(${(absoluteDistance * state.blur).toFixed(2)}px)`
        element.style.setProperty(
          "--ow-position",
          Math.max(0, 1 - Math.min(absoluteDistance, 1)).toFixed(4)
        )
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    animationFrameRef.current = requestAnimationFrame(render)
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setTarget(targetRef.current + event.deltaY / stateRef.current.rowHeight)
      if (wheelSnapTimeoutRef.current !== undefined) {
        window.clearTimeout(wheelSnapTimeoutRef.current)
      }
      wheelSnapTimeoutRef.current = window.setTimeout(() => {
        setTarget(targetRef.current, true)
      }, 120)
    }

    root.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      root.removeEventListener("wheel", handleWheel)
      if (wheelSnapTimeoutRef.current !== undefined) {
        window.clearTimeout(wheelSnapTimeoutRef.current)
        wheelSnapTimeoutRef.current = undefined
      }
    }
  }, [setTarget])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startPosition: targetRef.current
    }
    suppressClickRef.current = false
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const distance = event.clientY - drag.startY
    if (Math.abs(distance) > 3) {
      suppressClickRef.current = true
      rootRef.current?.setPointerCapture(event.pointerId)
    }
    if (suppressClickRef.current) {
      setTarget(drag.startPosition - distance / stateRef.current.rowHeight)
    }
  }

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = undefined
    setDragging(false)
    if (suppressClickRef.current) setTarget(targetRef.current, true)
  }

  const rootStyle = {
    "--ow-text-color": textColor,
    "--ow-active-color": activeColor,
    "--ow-x-padding": `${xPadding}px`,
    "--ow-longest": String(longest),
    ...(hasAuto ? { containerType: "inline-size" as const } : {})
  } as CSSProperties

  return (
    <Listbox
      aria-label="Article navigation"
      activation="automatic"
      keepInView={false}
      value={items[clamp(selectedIndex, items.length)] ?? null}
      onValueChange={(value, details) => {
        if (typeof value !== "string") return
        if (details.reason === "item-press") {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
          }
        } else {
          suppressClickRef.current = false
        }
        const index = items.indexOf(value)
        if (index === -1) return
        setTarget(index, true)
        onItemClickRef.current?.(index, value)
      }}
      ref={rootRef}
      className={cn(
        "relative h-full w-full touch-none overflow-hidden outline-none select-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      style={rootStyle}
      render={<div />}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
    >
      <div
        ref={innerRef}
        className="relative h-full w-full"
        style={{ fontSize: hasAuto ? autoFontSizeValue : `${fontSize}rem` }}
      >
        {items.map((item, index) => (
          <ListboxItem
            key={index}
            value={item}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            className="absolute top-1/2 left-[var(--ow-x-padding)] origin-left cursor-pointer leading-none whitespace-nowrap will-change-[filter,opacity,transform]"
            style={(state) => ({
              fontWeight: state.selected ? 600 : 400,
              color:
                "color-mix(in srgb, var(--ow-active-color) calc(var(--ow-position, 0) * 100%), var(--ow-text-color))"
            })}
            render={(props) => <div {...props} data-cursor="interactive" />}
          >
            {item}
          </ListboxItem>
        ))}
      </div>
    </Listbox>
  )
}
