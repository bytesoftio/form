# @bytesoftio/form

## Installation

`yarn add @bytesoftio/form` or `npm install @bytesoftio/form`

## Table of contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Description](#description)
- [Quick start](#quick-start)
- [Form config](#form-config)
- [Form values](#form-values)
- [Validation logic](#validation-logic)
- [Create form from schema definition](#create-form-from-schema-definition)
- [Validation and errors](#validation-and-errors)
- [Submit form and provide feedback](#submit-form-and-provide-feedback)
- [Reset form state](#reset-form-state)
- [Dirty fields and changed fields](#dirty-fields-and-changed-fields)
- [Status indicators](#status-indicators)
- [Usage with React](#usage-with-react)
  - [Isolating fields from unnecessary re-renders](#isolating-fields-from-unnecessary-re-renders)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Description

This package provides a very convenient abstraction for forms. I never liked the idea of forms being
defined and handled entirely inside the presentation layer, so I came up with this approach.

A form should be a first class citizen inside a project, kinda like a service. It should:

- Have an initial state
- Have a way to reset to initial state
- Have validation logic
- Have a handler
- Have things like loading indicators, dirty fields, etc.
- Have an easy way to bind to input elements
- Be typed properly 

Form logic consists mainly of these steps: 

- Define form data structure
- Provide initial state
- Define validation logic
- Define handler logic
- Provide status messages from within a handler like success, error, etc.
- Share form submission result

A form with all of these things should be treated like a regular service, 
it has no place inside a presentation component. A component should simply bind
form data to according input elements, consume validation errors and status messages,
block form during submission and other purely presentation related stuff.

If you agree at least with some of the points above, stay with me, this library totally 
changed how I work with forms and might change your approach as well.

## Quick start

Let's create a very simple form, where you can create a new user through an api call, with validation, etc. 
Keep in mind that this example could be much shorter in terms of lines of code It all depends on 
how much types you want to write. I always try to use as precise types as possible, so there is some boilerplate
code around. I think it totally pays off in the long run though.

```ts
// types.ts

// sample data type that you want to create through an api call
export type User = {
  uuid: string
  firstName: string
  lastName: string
}

// this is what the form looks like
export type CreateUserForm = {
  firstName: string
  lastName: string
}

// meaningful feedback for form consumers
export type CreateUserResult = {
  success?: string
  error?: string
  user?: User
}
```

```ts
// api.ts

import { User, CreateUserForm } from "./types"

// simulate api call for demo purposes
const createUser = async (data: CreateUserForm): Promise<User> => ({ id: 1, ...data })
```

```ts
// form.ts

import { createForm } from "@bytesoftio/form"
import { object, string } from "@bytesoftio/schema"
import { CreateUserForm, CreateUserResult } from "./types"
import { createUser } from "./api.ts"

// a dedicated form factory
export const createUserForm = () => {
  // create a new form with initial state
  return createForm<CreateUserForm, CreateUserResult>({
    firstName: "",
    lastName: ""
  })
    // using @bytesoftio/schema package for validation
    .schema(object({
      firstName: string().min(2).max(20),
      lastName: string().min(2).max(20)
    }))
    // add form handling logic
    .handler(async (form) => {
      try {
        // pretend to make an api call here 
        const user = await createUser(form.values.get())

        return { success: "User created", user }
      } catch (error) {
        return { error: "Could not create user" }
      }
    })
}
```

The [@bytesoftio/use-form](https://github.com/bytesoftio/use-form) package should be used to consume forms in React.

```tsx
// component.tsx

import React from "react"
import { useForm } from "@bytesoftio/use-form"
import { createUserForm } from "./form"

const CreateUserForm = () => {
  // create a new form instance and consume it for proper re-renders when state changes
  // also returns a binding untility to connect input elements with form values
  const [form, bind] = useForm(createUserForm)
  // grab what you need from various state objects
  const [errors, result] = [form.errors, form.result.get()]

  return (
    <form {...bind.form()}>
      <div>{result?.success || result?.error }</div>

      <div>
        <input {...bind.input("firstName")} placeholder="First name"/>
        <div>{errors.getAt("firstName")}</div>
      </div>

      <div>
        <input {...bind.input("lastName")} placeholder="Last name"/>
        <div>{errors.getAt("lastName")}</div>
      </div>

      <button {...bind.button()}>Create</button>
    </form>
  )
}
```

## Form config

Form behaviour can be altered through several config options:

```ts
import { createForm } from "@bytesoftio/form"

const form = createForm({})
	.configure({
    // run validation whenever from state changes
    validateOnChange: true,
    // if validateOnChange is set to true, define whether all fields should
    // be validated or only those that have been changed through user input
    validateChangedFieldsOnly: false,
    // run validattions before submitting form
    validateOnSubmit: true
  })
```

## Form values

All the form values are stored inside the `ObservableFormValues` object. It comes with a few convenient helper methods.

```ts
import { createForm } from "@bytesoftio/form"

const initialState = { field1: "", field2: "", field3: "" }
const form = createForm(initialState)

// retrieve all of the form values
form.values.get()

// replace all form values with new one
form.values.set({ field1: "foo", field2: "bar" })

// add / replace some of the values with new one
form.values.add({ field3: "baz" })

// reset values back to its initial state
form.values.reset()

// alternatively you can provide new state that should be used as initialState
form.values.reset({ field1: "-", field2: "-", field3: "-" })

// retrieve a spefcific form field value
form.values.getAt("path.to.field")

// replace a specific form field value
form.values.setAt("path.to.field", "value")

// check if form has a certain value
form.values.hasAt("path.to.field")
```

## Validation logic

Form can be validated in several ways. Mostly you'll want to use the `schema` method. It takes as schema description object produced by the [@bytesoftio/schema](https://github.com/bytesoftio/schema) package. But it is also possible to provide a custom validation function.

Lets take a look at the custom validate function first. A validation function can be `sync` or `async` and must return either `undefined` / nothing in case of a successful validation, or an error object of type `ValidationResult` that you can find in the [@bytesoftio/schema](https://github.com/bytesoftio/schema) package.

```tsx
import { createForm } from "@bytesoftio/form"

const form = createForm({ 
  title: "", 
  user: { firstName: "" }
})
  .validator(async (form) => {
    const values = form.values.get()

    // some validation logic ...
    
    return {
      title: ["Value missing"],
      "user.firstName": ["Value missing"]
    }
})
```

Additionally, it is possible to provide a validation schema powered by the very easy to use [@bytesoftio/schema](https://github.com/bytesoftio/schema) package.

```ts
import { createForm } from "@bytesoftio/form"
import { object, string } from "@bytesoftio/schema"

const form = createForm({ 
  title: "", 
  user: { firstName: "" }
})
  .schema(object({
    title: string().between(3, 50),
    user: object({ firstName: string().between(3, 50) })
  }))
```

## Create form from schema definition

In order to prevent unnecessary boilerplate code, it is possible to create a form based of a schema definition. It is important to either use the `value` helper from the `@bytesoftio/schema` package, or provide a defualt value using the `toDefault` method.

```ts
import { createFormFromSchema } from "@bytesoftio/form"
import { object, value } from "@bytesoftio/schema"

const form1 = createFormFromSchema(object({
  foo: value("default value").string().min(3),
  bar: value(12).number().max(100)
}))
// same as
const form2 = createFormFromSchema(object({
  foo: string().toDefault("default value").min(3),
  bar: number().toDefault(12).max(100)
}))
```

## Validation and errors

A form can be validated manually, before submission, using the `validate` method. The result is either `undefined`, in case of a successful validation, or an error object of type `ValidationResult`, from the [@bytesoftio/schema](https://github.com/bytesoftio/schema) package.

```ts
import { createForm } from "@bytesoftio/form"

const form = createForm({})
const errors = await form.validate()

if ( ! errors) {
  // submit form ...
}
```

Form can be configured to validate only the changed fields, or validate immediately on user input, etc. Take a look at [form config](#form-config) section. 

You can validate changed fields only without configuring the form, by providing a specific flag.

```ts
form.validate({ changedFieldsOnly: true })
```

When submitting a form, validations are run atomatically, unless configured otherwise.

You can access form errors anytime trough `form.errors` property. The errors object has many convenience method when dealing with errors.

```ts
import { createForm } from "@bytesoftio/form"

const form = createForm()

// get all validation errors
form.errors.get()

// replace old errors with new one
form.errors.set({ firstName: ["Value is missing"] })

// add some new errors, but keep the old ones
form.errors.add({ firstName: ["Value is missing"] })

// are there any errors, returns boolean
form.errors.has()

// clear all errors
form.errors.clear()

// get errors for a specific field
form.errors.getAt("path.to.field")

// replace old errors with the new ones for a specific field
form.errors.setAt("path.to.field", ["New error"])

// add new errors for a specific field, but keep the old ones
form.errors.addAt("path.to.field", "New error")
form.errors.addAt("path.to.field", ["New error1", "New error2"])

// check if there are errors for specific fields
form.errors.hasAt("path.to.field")
form.errors.hasAt(["path.to.field1"], "path.to.field2")

// clear errors for specific fields
form.errors.clearAt("path.to.field")
form.errors.clearAt(["path.to.field1", "path.to.field2"])
```

## Submit form and provide feedback

To submit a form to an API you need to provide a form handler. This piece of logic is responsible for extracting form values, sending data to an endpoint, handling remote errors, providing meaningful feedback to the form consumers / presentation layer.

```ts
import { createForm } from "@bytesoftio/form"

const form = createForm()
	.handler(async form => {
		try {
      const result = await sendFormData(form.values.get())
      
     	return  { success: "Data sent succefully", result }
    } catch (error) {
      return { error: "Could not send data" }
    }
  })
```

To provide meaningful feedback to form consumers, handler can return any kind of data, this data will be available as the result of a `submit()` call or inside the `form.result` observable property. Everything can be statically typed, take a look at [quick start](#quick-start) to learn more about this.

When submitting a form, validations are run automatically, you can prevent this by configuring the form accordingly, see [form config](#form-config), or setting a flag.

```ts
const result = await form.submit({ validate: false })
```

## Reset form state

You can reset all of the form state back to its initial value as well as all the errors, dirty fields, results, etc.

```ts
import { createForm } from "@bytesoftio/form"

const form = createForm({ field1: "foo", field2: "bar" })

// reset form
form.reset()

// reset form and provide a new initial state
form.reset({ field1: "", field2: ""})
```



## Dirty fields and changed fields

You can check if any specific field has been changed through user input. There is a differentiation between `diryFields` and `changedFields`. As soon as a form field has been changed, for example from `""` to `"foo"` - it becomes dirty. If the field changes back to `""`, it is still dirty. `changedFields` works slightly different. A field is changed only if the value is actually different from the initial one. So a field can be dirty and *not* changed at the same time.

`dirtyFields` and  `changedFields` have both the same interface `ObservableFormFields`. 

```ts
import { createForm } from "@bytesoftio/form"

const form = createForm({})

// grab all dirty fields, returns an array of strings[]
form.dirtyFields.get()

// check if on or multiple fields are dirty, returns boolean
form.dirtyFields.has("field")
form.dirtyFields.has(["field1", "path.to.field2"])

// replace old dirty fields with new opnes
form.dirtyFields.set(["field1", "path.to.field2"])

// add additional dirty fields to the existing ones
form.dirtyFields.add("field1")
form.dirtyFields.add(["field1", "path.to.field2"])

// remove some dirty fields
form.dirtyFields.remove("field1")
form.dirtyFields.remove(["field1", "path.to.field2"])

// clear all fields
form.dirtyfields.clear()

// get notified whenever dirty fields change
form.dirtyFields.listen((fields) => console.log(fields))
```

Once again, the `form.changedFields` object is absolutely identical, in terms of interface, to the `form.dirtyFields` one. There is no need for additional docs here.

## Status indicators

Sometimes you'll need a flag to tell if form is currently being submitted, or has already been submitted. In this case you can use one of these status objects: `form.submitting` or `form.submitted`. Both implement the `ObservableValue` interface that comes from the [@bytesoftio/value](https://github.com/bytesoftio/value) package and has all the relevant docs.

```ts
// is form currently being submitted, returns boolean
form.submitting.get()
// has form already been submitted, returns boolean
form.submitted.get()
```

## Usage with React

There is a very easy to use, hooks based, React integration for this library. That also comes with bindings for  basic HTML input elements. Please take a look at [@bytesoftio/use-form](https://github.com/bytesoftio/use-form)


### Isolating fields from unnecessary re-renders

In bigger forms you might want to isolate your fields from unnecessary re-renders. This can very easily be achieved using the [@bytesoftio/isolate](https://github.com/bytesoftio/isolate) package.

```tsx
import React, { useState } from "react"
import { createForm } from "@bytsoftio/form"
import { useForm } from "@bytsoftio/use-form"

const Component = () => {
  const form = useForm(() => createForm({ field1: "foo", field2: "bar" }))
  const [someValue, setSomeValue] = useState("some state")

  return (
    <form>
      <Isolate deps={form.deps("field1")}>
        This section will only ever re-render when some of shared form properties change, like: `submitting`, `submitted` or `result`, or when one of the field related properties receives a change speicifc to this field, like: `errors`, `values`, `changedFields` or `dirtyFields`. 
      </Isolate>
      
      <Isolate deps={form.deps(["field1", "field2"])}>
        This section will change when one of the two fields receives a relevant change
      </Isolate>

      <Isolate deps={form.deps(["field1", "field2"], { errors: false })}>
        This block will NOT re-render if there is an error for one of the two fields.
      </Isolate>

      <Isolate deps={[...form.deps(["field1", "field2"]), someValue]}>
        Include an aditional, custom, value to the list of dependencies for a re-render.
      </Isolate>
    </form>
  )
}
```
