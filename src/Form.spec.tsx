import { Form } from "./Form"
import { object, string } from "@bytesoftio/schema"
import { isString } from "lodash"
import { createTimeout } from "@bytesoftio/helpers-promises"

describe("Form", () => {
  it("creates with initial state", () => {
    const form = new Form({ foo: "bar" })

    expect(form.data.get()).toEqual({ foo: "bar" })
  })

  it("returns and sets state", () => {
    const form = new Form({})

    expect(form.data.get()).toEqual({})

    form.data.set({ foo: "bar" })

    expect(form.data.get()).toEqual({ foo: "bar" })
  })

  it("adds state", () => {
    const form = new Form<any>({ foo: "bar" })

    form.data.add({ yolo: "swag" })

    expect(form.data.get()).toEqual({ foo: "bar", yolo: "swag" })
  })

  it("returns state at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    expect(form.data.getAt("foo")).toBe("bar")
  })

  it("sets state at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    form.data.setAt("yolo", "swag")

    expect(form.data.get()).toEqual({ foo: "bar", yolo: "swag" })
  })

  it("tells if a value is set at given path", () => {
    const form = new Form<any>({ foo: "bar" })

    expect(form.data.hasAt("foo")).toBe(true)
    expect(form.data.hasAt("bar")).toBe(false)
  })

  it("resets everything to initial state", () => {
    const form = new Form<any>({ foo: "bar" })

    form.data.set({ yolo: "swag" })
    form.submitting.set(true)
    form.submitted.set(true)
    form.dirtyFields.set(["foo"])
    form.changedFields.set(["foo"])
    form.errors.set({ foo: ["bar"] })
    form.result.set({ foo: ["bar"] })

    form.reset()

    expect(form.data.get()).toEqual({ foo: "bar" })
    expect(form.submitting.get()).toEqual(false)
    expect(form.submitted.get()).toEqual(false)
    expect(form.dirtyFields.get()).toEqual([])
    expect(form.changedFields.get()).toEqual([])
    expect(form.errors.get()).toEqual(undefined)
    expect(form.result.get()).toEqual({})
  })

  it("submits", async () => {
    const handler = jest.fn().mockResolvedValue(true)
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: false })
    form.handler(handler)
    form.errors.set({ foo: ["bar"] })
    form.result.set({ foo: "bar" })

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    let result = await form.submit()

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(form)
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false, true])
    expect(form.errors.get()).toEqual(undefined)
    expect(form.result.get()).toEqual({})
  })

  it("handles rejections and thrown errors during submit", async () => {
    const errorLog = console.error
    console.error = jest.fn()

    const handler = jest.fn().mockRejectedValue(new Error("test"))
    const form = new Form({ foo: "bar" })
    form.handler(handler)

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    let receivedError: any

    try {
      await form.submit()
    } catch (error) {
      receivedError = error
    }

    expect(receivedError instanceof Error).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(form)
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false])

    console.error = errorLog
  })

  it("validates with schema", async () => {
    const form = new Form({ foo: "bar" })
      .schema(object({ foo: string().min(4) }))
      .schema(object({ bar: string().min(8) }))

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(isString(errors.foo[0])).toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(isString(errors.bar[0])).toBe(true)
  })

  it("validates with function", async () => {
    const validator = jest.fn()
    const form = new Form({ foo: "bar" })
      .validator(() => ({ foo: ["error"] }))
      .validator(() => ({ bar: ["error"] }))
      .validator(validator)

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(isString(errors.foo[0])).toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(isString(errors.bar[0])).toBe(true)
    expect(validator).toHaveBeenCalledTimes(1)
    expect(validator).toHaveBeenCalledWith(form)
  })

  it("handles errors during validate", async () => {
    const errorLog = console.error
    console.error = jest.fn()

    const validator = jest.fn().mockRejectedValue(new Error("test"))
    const form = new Form({ foo: "bar" })
      .configure({ validateOnChange: false })
      .validator(() => ({ foo: ["error"] }))
      .validator(() => ({ bar: ["error"] }))
      .validator(validator)

    let receivedError: any

    try {
      await form.validate()
    } catch (error) {
      receivedError = error
    }

    expect(receivedError instanceof Error).toBe(true)
    expect(validator).toHaveBeenCalledTimes(1)
    expect(validator).toHaveBeenCalledWith(form)

    console.error = errorLog
  })

  it("validates without validators", async () => {
    const form = new Form({ foo: "bar" })
    const errors = (await form.validate())

    expect(errors).toBe(undefined)
  })

  it("validates with mixed validators", async () => {
    const form = new Form({ foo: "bar" })
      .validator(() => ({ foo: ["error"] }))
      .schema(object({ bar: string().min(8) }))

    const errors = (await form.validate())!

    expect(errors.foo.length).toBe(1)
    expect(isString(errors.foo[0])).toBe(true)
    expect(errors.bar.length).toBe(1)
    expect(isString(errors.bar[0])).toBe(true)
  })

  it("validates with passing validators", async () => {
    const form = new Form({ foo: "bar" })
      .validator(() => undefined)
      .schema(object({ foo: string().min(3) }))

    const errors = (await form.validate())!

    expect(errors).toBe(undefined)
  })

  it("validates explicitly on submit", async () => {
    const handler = jest.fn()
    const validator = jest.fn()
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: false })
      .validator(validator)
      .handler(handler)

    await form.submit()

    expect(validator).toHaveBeenCalledTimes(0)
    expect(handler).toHaveBeenCalledTimes(1)

    await form.submit({ validate: true })

    expect(validator).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(2)

    await form.submit({ validate: false })

    expect(validator).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(3)

    form.configure({ validateOnSubmit: true })

    await form.submit()

    expect(validator).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(4)

    await form.submit({ validate: false })

    expect(validator).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(5)

    await form.submit({ validate: true })

    expect(validator).toHaveBeenCalledTimes(3)
    expect(handler).toHaveBeenCalledTimes(6)
  })

  it("validates on submit and aborts submit on validation errors", async () => {
    const handler = jest.fn()
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: true })
      .validator(() => ({ foo: ["error"] }))
      .handler(handler)

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    const errors: any[] = []
    form.errors.listen((value) => {
      errors.push(value)
    })

    const status = (await form.submit())

    expect(status).toBe(false)
    expect(handler).not.toHaveBeenCalled()
    expect(errors).toEqual([{}, { foo: ["error"] }])
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false])
  })

  it("validates on submit and submits if there are no validation errors", async () => {
    const handler = jest.fn()
    const form = new Form({ foo: "bar" })
      .configure({ validateOnSubmit: true })
      .validator(() => undefined)
      .handler(handler)

    const submitting: any[] = []
    form.submitting.listen((value) => {
      submitting.push(value)
    })

    const submitted: any[] = []
    form.submitted.listen((value) => {
      submitted.push(value)
    })

    const errors: any[] = []
    form.errors.listen((value) => {
      errors.push(value)
    })

    const status = (await form.submit())

    expect(status).toBe(true)
    expect(handler).toHaveBeenCalled()
    expect(errors).toEqual([{}])
    expect(submitting).toEqual([false, true, false])
    expect(submitted).toEqual([false, true])
  })

  it("validates changed fields only", async () => {
    const form = new Form({ foo: "ba", bar: "ba" })
      .configure({ validateChangedFieldsOnly: true })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    const errors1 = await form.validate()

    expect(errors1).toBe(undefined)

    form.changedFields.add("foo")

    const errors2 = (await form.validate())!

    expect(errors2.foo.length).toBe(1)
    expect(isString(errors2.foo[0])).toBe(true)
  })

  it("validates on change", async () => {
    const form = new Form({ foo: "ba", bar: "ba" })
      .configure({ validateOnChange: true })
      .schema(object({ foo: string().min(3), bar: string().min(3) }))

    expect(form.errors.get()).toBe(undefined)

    form.data.setAt("foo", "b")

    await createTimeout(0)

    expect(form.errors.get()).not.toBe(undefined)
    expect(form.errors.get()!.foo.length).toBe(1)
  })

  it("tracks a field as dirty and changed", () => {
    const form = new Form({ foo: "bar" })

    form.data.setAt("foo", "bar")

    expect(form.dirtyFields.get()).toEqual(["foo"])
    expect(form.changedFields.get()).toEqual([])

    form.data.setAt("foo", "baz")

    expect(form.dirtyFields.get()).toEqual(["foo"])
    expect(form.changedFields.get()).toEqual(["foo"])
  })

  it("listens", async () => {
    const form = new Form({ foo: { bar: "baz" } })
    let listener = jest.fn()

    form.listen(listener)

    expect(listener).toHaveBeenCalledTimes(7)
    expect(listener).toHaveBeenCalledWith(form)

    form.data.setAt("foo.bar", "yolo")

    expect(listener).toHaveBeenCalledTimes(10)
    expect(listener).toHaveBeenCalledWith(form)
  })
})