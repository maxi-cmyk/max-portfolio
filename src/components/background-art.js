// Mount the generated artwork after the main Home controls in reading order.
export function initBackgroundArt() {
  const icons = document.querySelector("#home .desktop-icons");
  const artwork = document.getElementById("desk-artwork");
  if (icons && artwork) icons.after(artwork.content.cloneNode(true));
}
