import { createFormFromSchema } from "./createFormFromSchema"
import { object } from "@bytesoftio/schema"
import { value } from "../../schema/src"

describe("createFromFromSchema", () => {
  it("creates from from schema with default values", async () => {
    const form = createFormFromSchema(object({
      foo: value('bar').string().oneOf(['foo', 'yolo'])
    }))

    expect(form.values.getAt("foo")).toBe('bar')

    const errors = await form.validate()

    expect(errors !== undefined).toBe(true)

    form.values.setAt("foo", "foo")
    expect(await form.validate()).toBe(undefined)
  })
})
