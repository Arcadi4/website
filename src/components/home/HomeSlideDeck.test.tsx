import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, expect, test, vi } from "vite-plus/test"
import { HomeSlideDeck } from "./HomeSlideDeck"

beforeAll(() => {
  if (!("IntersectionObserver" in globalThis)) {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      }
    )
  }
  if (typeof globalThis.requestAnimationFrame !== "function") {
    vi.stubGlobal("requestAnimationFrame", () => 0)
    vi.stubGlobal("cancelAnimationFrame", () => {})
  }
})

test("sidebar buttons announce and change the active scene", async () => {
  const user = userEvent.setup()
  render(
    <HomeSlideDeck labels={["Home", "About"]}>
      <p>Home scene</p>
      <p>About scene</p>
    </HomeSlideDeck>
  )

  expect(screen.getByText("Scene 1 of 2: Home")).toBeTruthy()
  expect(
    screen.getByRole("button", { name: "Go to scene 1: Home" })
  ).toBeTruthy()
  const secondScene = screen.getByRole("button", {
    name: "Go to scene 2: About"
  })

  await user.click(secondScene)

  expect(await screen.findByText("Scene 2 of 2: About")).toBeTruthy()
})
