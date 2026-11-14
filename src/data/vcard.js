// A contact card (.vcf) from facts that are already public on the site. No
// phone number: that stays out until it is supplied.
export function buildVCard() {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Leong;Max;;;",
    "FN:Max Leong",
    "TITLE:CS student",
    "EMAIL;TYPE=INTERNET:maxleong32@gmail.com",
    "URL:https://nfc-portfolio-card.vercel.app",
    "URL;TYPE=GitHub:https://github.com/maxi-cmyk",
    "URL;TYPE=LinkedIn:https://www.linkedin.com/in/maxleongruisheng",
    "NOTE:CS student interested in the intersection between low-level logic\\, hardware and cybersecurity. Occasionally explores AI-based projects.",
    "END:VCARD",
  ];
  return `${lines.join("\r\n")}\r\n`;
}
