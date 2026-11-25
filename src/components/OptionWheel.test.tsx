import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, expect, test, vi } from "vite-plus/test"
import OptionWheel from "./OptionWheel"

beforeAll(() => {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    vi.stubGlobal("requestAnimationFrame", () => 0)
    vi.stubGlobal("cancelAnimationFrame", () => {})
  }
})

test("ArrowDown and clicking an option report the chosen item", async () => {
  const items = ["Solar circuits", "Tidal moons", "Paper engines"]
  const onItemClick = vi.fn()
  const user = userEvent.setup()

  render(
    <OptionWheel items={items} selectedIndex={0} onItemClick={onItemClick} />
  )

  const listbox = screen.getByRole("listbox", { name: "Article navigation" })
  const options = within(listbox).getAllByRole("option")
  expect(options).toHaveLength(3)
  expect(options.map((option) => option.textContent)).toEqual(items)

  listbox.focus()
  await user.keyboard("{ArrowDown}")
  expect(onItemClick).toHaveBeenCalledWith(1, items[1])

  await user.click(within(listbox).getByRole("option", { name: items[2] }))
  expect(onItemClick).toHaveBeenCalledWith(2, items[2])
})
