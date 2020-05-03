import { createFormData } from "./createFormData"
import { FormData } from "./FormData"
import { createFormFields } from "./createFormFields"

describe("createFormData", () => {
  it("creates state", () => {
    const state = createFormData(undefined, createFormFields(), createFormFields())

    expect(state instanceof FormData).toBe(true)
    expect(state.get()).toEqual({})
  })

  it("creates state with initial state", () => {
    const state = createFormData({ foo: "bar" }, createFormFields(), createFormFields())

    expect(state instanceof FormData).toBe(true)
    expect(state.get()).toEqual({ foo: "bar" })
  })
})