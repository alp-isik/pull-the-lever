import { Suggestion } from "../models/index.js";

export async function createSuggestion(text) {
  return Suggestion.create({ text: text.trim() });
}

// Oldest first, so the admin reads them in the order they came in.
export async function findAllSuggestions() {
  return Suggestion.findAll({ order: [["id", "ASC"]] });
}

export function toSuggestionJson(suggestion) {
  return { id: suggestion.id, text: suggestion.text, createdAt: suggestion.createdAt };
}

// Return false if the suggestion does not exist.
export async function deleteSuggestion(suggestionId) {
  const deletedCount = await Suggestion.destroy({ where: { id: suggestionId } });
  if (deletedCount === 0) {
    return false;
  }
  return true;
}
