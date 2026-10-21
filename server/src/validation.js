export const MAX_DILEMMA_LENGTH = 200;
export const MAX_OPTION_LENGTH = 60;

// Turn a route parameter or body value into a positive whole number, or null.
export function parseId(value) {
  const id = Number(value);
  if (Number.isInteger(id) && id > 0) {
    return id;
  }
  return null;
}

export function isValidText(value, maxLength) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedText = value.trim();
  if (trimmedText.length === 0 || trimmedText.length > maxLength) {
    return false;
  }
  return true;
}

// A dilemma needs its text and exactly two options.
export function isValidDilemma(text, options) {
  if (!isValidText(text, MAX_DILEMMA_LENGTH)) {
    return false;
  }
  if (!Array.isArray(options) || options.length !== 2) {
    return false;
  }
  if (!options.every((option) => isValidText(option, MAX_OPTION_LENGTH))) {
    return false;
  }
  return true;
}
