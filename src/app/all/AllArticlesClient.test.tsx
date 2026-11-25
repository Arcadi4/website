import { createAgent } from "@ui-sdk/react/agent"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vite-plus/test"
import type { ArticleMeta } from "@/lib/content"
import { AllArticlesClient } from "./AllArticlesClient"

const articles: readonly ArticleMeta[] = [
  {
    slug: "solar-circuits",
    title: "Solar circuits",
    excerpt: "Photovoltaic wiring for tiny cities",
    publishDate: new Date("2025-03-01"),
    lastEditedTime: new Date("2025-03-02"),
    tags: ["energy", "physics"]
  },
  {
    slug: "tidal-moons",
    title: "Tidal moons",
    excerpt: "Orbital rhythms of distant satellites",
    publishDate: new Date("2025-02-01"),
    lastEditedTime: new Date("2025-02-02"),
    tags: ["astronomy"]
  },
  {
    slug: "paper-engines",
    title: "Paper engines",
    excerpt: "Folded mechanisms that run on air",
    publishDate: new Date("2025-01-01"),
    lastEditedTime: new Date("2025-01-02"),
    tags: ["craft"]
  }
]

function visibleTitles() {
  return Array.from(document.querySelectorAll("article"))
    .filter(
      (article) => !article.hidden && !article.classList.contains("hidden")
    )
    .flatMap((article) =>
      Array.from(article.querySelectorAll("h2")).map(
        (heading) => heading.textContent ?? ""
      )
    )
}

const agent = createAgent()

test("search narrows the articles and the controls are named", async () => {
  const user = userEvent.setup()
  render(<AllArticlesClient articles={articles} />)

  expect(visibleTitles()).toEqual([
    "Solar circuits",
    "Tidal moons",
    "Paper engines"
  ])
  expect(
    screen.getByRole("searchbox", { name: "Search articles" })
  ).toBeTruthy()
  expect(screen.getByRole("button", { name: "Show all tags" })).toBeTruthy()
  expect(
    screen.getByRole("group", { name: "Filter articles by tag" })
  ).toBeTruthy()

  await user.type(
    screen.getByRole("searchbox", { name: "Search articles" }),
    "photovoltaic"
  )

  expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy()
  expect(visibleTitles()).toEqual(["Solar circuits"])
})

test("a tag toggle becomes pressed and filters the articles", async () => {
  const user = userEvent.setup()
  render(<AllArticlesClient articles={articles} />)

  const tag = screen.getByRole("button", { name: "+ astronomy" })
  expect(tag.getAttribute("aria-pressed")).not.toBe("true")

  await user.click(tag)

  expect(
    tag.getAttribute("aria-pressed") === "true" ||
      tag.hasAttribute("data-pressed")
  ).toBe(true)
  expect(visibleTitles()).toEqual(["Tidal moons"])
})

test("an agent reads named controls and changes the search value", async () => {
  const user = userEvent.setup()
  render(<AllArticlesClient articles={articles} />)
  // InputClear only renders once the search has a value.
  await user.type(
    screen.getByRole("searchbox", { name: "Search articles" }),
    "circuits"
  )

  const entries = agent
    .snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more")
  expect(entries.length).toBeGreaterThan(0)
  for (const entry of entries) {
    expect(
      entry.label,
      `${entry.component} (${entry.ref}) has no label`
    ).toBeTruthy()
  }
  expect(entries.map((entry) => entry.label)).toEqual(
    expect.arrayContaining([
      "Search articles",
      "Show all tags",
      "Filter articles by tag"
    ])
  )

  const result = await agent.act({
    steps: [{ ref: "Search articles", action: "setValue", args: ["paper"] }]
  })
  expect(result.ok).toBe(true)

  const searchbox = screen.getByRole("searchbox", {
    name: "Search articles"
  }) as HTMLInputElement
  expect(searchbox.value).toBe("paper")
})
