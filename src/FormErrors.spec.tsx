import React from "react"
import { FormErrors } from "./FormErrors"
import { mount } from "enzyme"
import { act } from "react-dom/test-utils"

describe("FormErrors", () => {
  it("returns and sets errors", () => {
    const errors = new FormErrors()

    expect(errors.get()).toBe(undefined)

    errors.set({ foo: ["bar"] })

    expect(errors.get()).toEqual({ foo: ["bar"] })

    errors.set({ foo: ["baz"] })

    expect(errors.get()).toEqual({ foo: ["baz"] })
  })

  it("returns initial errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.get()).toEqual({ foo: ["bar"] })
  })

  it("tells if there are any errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.has()).toBe(true)

    errors.clear()

    expect(errors.has()).toBe(false)
  })

  it("takes new errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    errors.set({ bar: ["foo"] })

    expect(errors.get()).toEqual({ bar: ["foo"] })
  })

  it("adds new errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    errors.add({ bar: ["foo"] })

    expect(errors.get()).toEqual({ foo: ["bar"], bar: ["foo"] })
  })

  it("clears errors", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    errors.clear()

    expect(errors.get()).toBe(undefined)
  })

  it("returns error at given path", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.getAt("foo")).toEqual(["bar"])
    expect(errors.getAt("bar")).toEqual(undefined)
  })

  it("adds errors at given path", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    errors.addAt("foo", ["yolo"])

    expect(errors.get()).toEqual({ foo: ["bar", "yolo"] })

    errors.addAt("bar", ["yolo"])

    expect(errors.get()).toEqual({ foo: ["bar", "yolo"], bar: ["yolo"] })

    errors.addAt("bar", "baz")

    expect(errors.get()).toEqual({ foo: ["bar", "yolo"], bar: ["yolo", "baz"] })
  })

  it("tells if there are any errors at given path", () => {
    const errors = new FormErrors({ foo: ["bar"] })

    expect(errors.hasAt("foo")).toBe(true)
    expect(errors.hasAt("bar")).toBe(false)
    expect(errors.hasAt(["foo", "bar"])).toBe(true)
    expect(errors.hasAt(["bar", "baz"])).toBe(false)
  })

  it("removes errors at", () => {
    const errors = new FormErrors({ foo: ["bar"], yolo: ["swag"] })

    errors.clearAt("yolo")

    expect(errors.get()).toEqual({ foo: ["bar"] })

    errors.set({ foo: ["bar"], yolo: ["swag"], baz: ["boink"] })

    errors.clearAt(["foo", "yolo"])

    expect(errors.get()).toEqual({ baz: ["boink"] })
  })

  it("hooks inside react", async () => {
    const errors = new FormErrors({ foo: [] })

    const Test = () => {
      const [value] = errors.use()

      return (
        <h1>{value.foo.length}</h1>
      )
    }

    const wrapper = mount(<Test/>)
    const target = () => wrapper.find("h1")

    expect(target().text()).toBe("0")

    act(() => errors.addAt("foo", "baz"))

    expect(target().text()).toBe("1")
  })

  it("hooks outside react", () => {
    const errors = new FormErrors({ foo: ["bar"] })
    const callback = jest.fn()

    errors.listen(callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({ foo: ["bar"] })

    errors.addAt("bar", "baz")

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith({ foo: ["bar"], bar: ["baz"] })
  })
})