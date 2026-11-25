"use client"

import { ScenePersistentLayer } from "@/components/animations/ScenePersistentElement"
import { LineSidebar } from "@/components/ui/line-sidebar"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselViewport
} from "@ui-sdk/react/carousel"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react"
import styles from "./HomeSlideDeck.module.css"

type HomeSlideState = "active" | "future" | "past"

type HomeSlideDeckProps = {
  readonly children: ReactNode
  readonly labels: readonly string[]
}

const HomeSlideStateContext = createContext<HomeSlideState | null>(null)

export function useHomeSlideState() {
  const state = useContext(HomeSlideStateContext)

  if (state === null) {
    throw new Error("useHomeSlideState must be used within a HomeSlideDeck.")
  }

  return state
}

export function HomeSlideDeck({ children, labels }: HomeSlideDeckProps) {
  const slides = useMemo(() => Children.toArray(children), [children])
  const [activeIndex, setActiveIndex] = useState(0)
  const lastIndex = slides.length - 1

  const selectSlide = useCallback(
    (nextIndex: number) => {
      setActiveIndex(Math.min(Math.max(nextIndex, 0), lastIndex))
    },
    [lastIndex]
  )

  if (slides.length !== labels.length) {
    throw new Error("HomeSlideDeck requires one label for every slide.")
  }

  return (
    <Carousel
      orientation="vertical"
      page={activeIndex + 1}
      onPageChange={(page) => setActiveIndex(page - 1)}
      render={
        <main
          aria-label="Homepage scenes"
          className="relative isolate h-svh w-dvw bg-background text-foreground"
          data-home-deck
        />
      }
    >
      <p aria-live="polite" className="sr-only">
        Scene {activeIndex + 1} of {slides.length}: {labels[activeIndex]}
      </p>

      <CarouselViewport className={cn(styles.deck, "h-svh w-dvw")} tabIndex={0}>
        <CarouselContent>
          {slides.map((slide, index) => {
            const state: HomeSlideState =
              index === activeIndex
                ? "active"
                : index < activeIndex
                  ? "past"
                  : "future"

            return (
              <CarouselItem key={labels[index]}>
                <HomeSlideStateContext.Provider value={state}>
                  <section
                    aria-label={`${index + 1} of ${slides.length}: ${labels[index]}`}
                    className="relative z-2 min-h-svh snap-start snap-always overflow-x-clip"
                    data-home-scene
                    data-scene-index={index}
                    data-state={state}
                  >
                    {slide}
                  </section>
                </HomeSlideStateContext.Provider>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </CarouselViewport>

      <ScenePersistentLayer activeIndex={activeIndex} />

      <div className="fixed top-1/2 right-8 z-50 -translate-y-1/2 mix-blend-difference">
        <LineSidebar
          activeIndex={activeIndex}
          aria-label="Choose a homepage scene"
          items={labels}
          onItemClick={selectSlide}
          className="font-mono text-[.7rem] uppercase"
          accentColor="var(--color-magenta)"
          markerColor="rgba(255, 255, 255, 0.2)"
          textColor="#fff"
          itemGap={10}
          fontSize={0.7}
          maxShift={8}
          markerLength={18}
          proximityRadius={90}
        />
      </div>
    </Carousel>
  )
}
