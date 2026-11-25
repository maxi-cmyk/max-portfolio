import { certificates } from "../data/certificates.js";

const certificateList = document.querySelector("#certificate-list");
function createCertificateEntry(certificate) {
  const entry = document.createElement("article");
  entry.className = "certificate-entry";

  const previewLink = document.createElement("a");
  previewLink.className = "certificate-preview";
  previewLink.href = certificate.pdfUrl;
  previewLink.target = "_blank";
  previewLink.rel = "noreferrer";
  previewLink.setAttribute(
    "aria-label",
    `Open ${certificate.title} in a new tab`,
  );

  const previewImage = document.createElement("img");
  previewImage.src = certificate.previewUrl;
  previewImage.alt = certificate.previewAlt;
  previewImage.width = certificate.previewWidth;
  previewImage.height = certificate.previewHeight;
  previewImage.loading = "lazy";
  previewImage.decoding = "async";
  previewLink.append(previewImage);

  const details = document.createElement("div");
  details.className = "certificate-details";

  // A date stamp, then the title and who issued it.
  const date = document.createElement("p");
  date.className = "certificate-date";
  date.textContent = certificate.issued;

  const issuer = document.createElement("p");
  issuer.className = "certificate-issuer";
  issuer.textContent = certificate.issuer;

  const title = document.createElement("h3");
  title.textContent = certificate.title;

  const summary = document.createElement("p");
  summary.className = "certificate-summary";
  summary.textContent = certificate.summary;

  const actions = document.createElement("div");
  actions.className = "certificate-actions";

  const viewLink = document.createElement("a");
  viewLink.href = certificate.pdfUrl;
  viewLink.target = "_blank";
  viewLink.rel = "noreferrer";
  viewLink.className = "pk-btn";
  viewLink.textContent = "Open certificate ↗";

  const downloadLink = document.createElement("a");
  downloadLink.href = certificate.pdfUrl;
  downloadLink.download = certificate.pdfUrl.split("/").pop();
  downloadLink.textContent = "Download PDF ↓";

  actions.append(viewLink, downloadLink);
  details.append(date, title, issuer, summary, actions);
  entry.append(previewLink, details);
  return entry;
}

export function initCertificates() {
  if (!certificateList || certificateList.dataset.enhanced) return;
  certificateList.dataset.enhanced = "true";

  // Room on the board for the certificates still to come.
  const next = document.createElement("p");
  next.className = "certificate-next";
  next.setAttribute("aria-hidden", "true");
  next.textContent = "space for the next one";
  certificateList.replaceChildren(
    ...certificates.map(createCertificateEntry),
    next,
  );
}
