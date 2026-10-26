// The client has a copy of these limits in client/src/limits.js. Change both together.
export const MAX_DILEMMA_LENGTH = 200;
// What stands on a track, for example "5 people". The game draws 1 to 5 people on each track.
export const MAX_TRACK_LABEL_LENGTH = 30;
export const MIN_PEOPLE_ON_TRACK = 1;
export const MAX_PEOPLE_ON_TRACK = 5;
export const MAX_SUGGESTION_LENGTH = 300;

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

function isValidPeopleCount(value) {
  if (Number.isInteger(value) && value >= MIN_PEOPLE_ON_TRACK && value <= MAX_PEOPLE_ON_TRACK) {
    return true;
  }
  return false;
}

// A track needs a label and the number of people to draw on it.
function isValidTrack(track) {
  if (typeof track !== "object" || track === null) {
    return false;
  }
  if (!isValidText(track.trackLabel, MAX_TRACK_LABEL_LENGTH)) {
    return false;
  }
  if (!isValidPeopleCount(track.peopleOnTrack)) {
    return false;
  }
  return true;
}

// A dilemma needs its text and what stands on each of the two tracks.
export function isValidDilemma(text, doNothing, pullTheLever) {
  if (!isValidText(text, MAX_DILEMMA_LENGTH)) {
    return false;
  }
  if (!isValidTrack(doNothing) || !isValidTrack(pullTheLever)) {
    return false;
  }
  return true;
}
