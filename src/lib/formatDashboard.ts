const NUMBER_EMOJIS: Record<number, string> = {
  0: "0️⃣",
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
};

function toEmojiNumber(num: number): string {
  return String(num)
    .split("")
    .map((d) => NUMBER_EMOJIS[parseInt(d)])
    .join("");
}

interface StatRow {
  name: string;
  count: number;
}

export function formatDashboardMessage(
  byUser: StatRow[],
  byCampaign: StatRow[],
  totalLeads: number,
  sentBy: String,
): string {
  const userLines = byUser
    .map((r) => `${toEmojiNumber(r.count)} ${r.name}`)
    .join("\n");

  const campaignLines = byCampaign
    .map((r) => `${toEmojiNumber(r.count)} ${r.name}`)
    .join("\n");

  const totalLine = toEmojiNumber(totalLeads);

  return `
==============================
    POWER RINGERS 
==============================
${userLines}
==============================
Total Leads ${totalLine}
==============================
${campaignLines}
==============================
sent by : ${sentBy}`;
}
