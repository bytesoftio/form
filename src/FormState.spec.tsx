import { FormState } from "./FormState"
import { createFormFields } from "./createFormFields"

describe("FormState", () => {
  it("sets and returns state", () => {
    const state = new FormState<any>({}, createFormFields(), createFormFields())

    expect(state.get()).toEqual({})

    state.set({ foo: "bar" })

    expect(state.get()).toEqual({ foo: "bar" })

    state.set({ yolo: "swag" })

    expect(state.get()).toEqual({ yolo: "swag" })
  })

  it("returns initial state", () => {
    const state = new FormState({ foo: "bar" }, createFormFields(), createFormFields())

    expect(state.get()).toEqual({ foo: "bar" })
  })

  it("adds new state", () => {
    const state = new FormState<any>({ foo: "bar" }, createFormFields(), createFormFields())
    state.add({ bar: "baz" })

    expect(state.get()).toEqual({ foo: "bar", bar: "baz" })
  })

  it("resets to initial state", () => {
    const state = new FormState<any>({ foo: "bar" }, createFormFields(), createFormFields())

    state.add({ bar: "baz" })
    state.reset()

    expect(state.get()).toEqual({ foo: "bar" })

    state.add({ bar: "baz" })
    state.reset({ yolo: "swag" })

    expect(state.get()).toEqual({ yolo: "swag" })

    state.add({ bar: "baz" })
    state.reset()

    expect(state.get()).toEqual({ yolo: "swag" })
  })

  it("returns state at", () => {
    const state = new FormState<any>({ foo: "bar" }, createFormFields(), createFormFields())

    expect(state.getAt("foo")).toBe("bar")
    expect(state.getAt("bar")).toBe(undefined)
  })

  it("sets state at", () => {
    const state = new FormState<any>({ foo: "bar" }, createFormFields(), createFormFields())

    state.setAt("foo", "baz")
    state.setAt("yolo", "swag")

    expect(state.get()).toEqual({ foo: "baz", yolo: "swag" })
  })

  it("tells if state is set at", () => {
    const state = new FormState<any>({ foo: "bar" }, createFormFields(), createFormFields())

    expect(state.hasAt("foo")).toBe(true)
    expect(state.hasAt("bar")).toBe(false)
  })

  it("listens to changes", () => {
    const state = new FormState({ foo: "bar", baz: { yolo: "swag" } }, createFormFields(), createFormFields())
    const callback = jest.fn()

    state.listen(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ foo: "bar", baz: { yolo: "swag" } })

    state.setAt("foo", "baz")

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith({ foo: "baz", baz: { yolo: "swag" } })

    state.setAt("baz.yolo", "bar")

    expect(callback).toHaveBeenCalledTimes(3)
    expect(callback).toHaveBeenCalledWith({ foo: "baz", baz: { yolo: "bar" } })
  })
})