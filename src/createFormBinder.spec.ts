import { createFormBinder } from "./createFormBinder"
import { FormBinder } from "./FormBinder"
import { createForm } from "./createForm"

describe("createFormBinder", () => {
  it("creates form binder", () => {
    const form = createForm({})
    const binder = createFormBinder(form)

    expect(binder instanceof FormBinder).toBe(true)
  })
})