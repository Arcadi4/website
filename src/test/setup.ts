import { cleanup } from "@testing-library/react"
import { afterEach } from "vite-plus/test"

declare global {
  var __UI_SDK_STRICT__: boolean | undefined
}
globalThis.__UI_SDK_STRICT__ = true

HTMLElement.prototype.showPopover = function () {}
HTMLElement.prototype.hidePopover = function () {}
Element.prototype.getAnimations = () => []
Element.prototype.scrollIntoView = function () {}
Element.prototype.checkVisibility = () => true
Element.prototype.getClientRects = () => [] as unknown as DOMRectList
document.elementFromPoint = () => null
document.elementsFromPoint = () => []
Object.defineProperty(document, "fonts", {
  configurable: true,
  value: { ready: Promise.resolve() }
})
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
document.head.append(
  Object.assign(document.createElement("style"), {
    textContent: "[popover] { display: block !important }"
  })
)

afterEach(cleanup)
