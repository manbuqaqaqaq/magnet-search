const FAV_KEY = "magnet_search_favorites";
const MAX_FAVORITES = 200;

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); }
  catch { return []; }
}

export function addFavorite(item) {
  const list = getFavorites().filter((f) => f.infoHash !== item.infoHash);
  list.unshift(item);
  localStorage.setItem(FAV_KEY, JSON.stringify(list.slice(0, MAX_FAVORITES)));
}

export function removeFavorite(infoHash) {
  const list = getFavorites().filter((f) => f.infoHash !== infoHash);
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

export function isFavorite(infoHash) {
  return getFavorites().some((f) => f.infoHash === infoHash);
}
