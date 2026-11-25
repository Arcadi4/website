import * as runtime from "react/jsx-runtime"
import type { ComponentType } from "react"
import { cn } from "@/lib/utils"
import styles from "./MarkdownContent.module.css"

/** Compiled MDX function body emitted by the content layer. */
type MdxContent = ComponentType

type MarkdownContentProps = {
  readonly className?: string
  readonly code: string
}

const cached = new Map<string, MdxContent>()

function compile(code: string): MdxContent {
  const existing = cached.get(code)
  if (existing) return existing

  const { default: Content } =
    // oxlint-disable-next-line typescript/no-implied-eval -- MDX ships function bodies; the content layer compiled this from our own repository.
    (new Function(code) as (scope: unknown) => { default: MdxContent })(runtime)

  cached.set(code, Content)
  return Content
}

/**
 * MDX boundary for article bodies; its CSS applies the restrained Swiss reading
 * typography without inventing a second document model.
 */
export function MarkdownContent({ className, code }: MarkdownContentProps) {
  const Content = compile(code)

  // oxlint-disable-next-line react/static-components -- compile() caches one stable component per immutable MDX body.
  const content = <Content />

  return <article className={cn(styles.content, className)}>{content}</article>
}
