import { keys } from "lodash"

export const isEmptyErrorsObject = (errors: object|undefined): boolean => {
  return ! errors || keys(errors).length === 0
}
