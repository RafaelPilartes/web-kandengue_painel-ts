export const converter = {
  stringToNumber: (value: string): number => {
    const result = Number(value)
    if (isNaN(result)) {
      throw new Error('Invalid string format for number conversion')
    }
    return result
  },

  numberToString: (value: number): string => {
    return value.toString()
  },

  booleanToNumber: (value: boolean): number => {
    if (value) {
      return 1
    } else {
      return 0
    }
  },

  stringToBoolean: (value: string): boolean => {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes'].includes(normalized)) return true
    if (['false', '0', 'no'].includes(normalized)) return false

    throw new Error('Invalid string format for boolean conversion')
  },

  numberToBoolean: (value: number): boolean => {
    if (value === 1) {
      return true
    } else if (value === 0) {
      return false
    } else {
      throw new Error('Invalid number format for boolean conversion')
    }
  },
  booleanToString: (value: boolean): string => {
    return value ? 'true' : 'false'
  },

  stringBoolToStringNum: (value: string): string => {
    const bool = converter.stringToBoolean(value)
    return bool ? '1' : '0'
  }
}
