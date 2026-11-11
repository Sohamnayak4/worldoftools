import { MB } from "./format";

// Platform limits. Every value was read on the platform's own official page
// on the date in `checked`. Never edit a value here from memory: open the
// source page, confirm the number, and update `checked`.

export type Limit = {
  platform: string;
  // What the limit applies to, in plain words.
  appliesTo: string;
  bytes: number;
  // How the platform writes it.
  display: string;
  sourceUrl: string;
  // Date the source page was last read, as YYYY-MM-DD.
  checked: string;
  note?: string;
};

const GB = 1000 * MB;

export const limits = {
  discordFree: {
    platform: "Discord",
    appliesTo: "File upload without Nitro",
    bytes: 20 * MB,
    display: "20 MB",
    sourceUrl:
      "https://support.discord.com/hc/en-us/articles/25444343291031-File-Attachments-FAQ",
    checked: "2026-11-12",
    note: "Raised from 10 MB in August 2026. Discord checks the size before its own compression.",
  },
  discordNitroBasic: {
    platform: "Discord",
    appliesTo: "File upload with Nitro Basic",
    bytes: 50 * MB,
    display: "50 MB",
    sourceUrl:
      "https://support.discord.com/hc/en-us/articles/25444343291031-File-Attachments-FAQ",
    checked: "2026-11-12",
  },
  discordNitro: {
    platform: "Discord",
    appliesTo: "File upload with Nitro",
    bytes: 1 * GB,
    display: "1 GB",
    sourceUrl:
      "https://support.discord.com/hc/en-us/articles/25444343291031-File-Attachments-FAQ",
    checked: "2026-11-12",
  },
  whatsappVideoFast: {
    platform: "WhatsApp",
    appliesTo: "Video sent as media on a faster connection",
    bytes: 100 * MB,
    display: "100 MB at 720p",
    sourceUrl: "https://faq.whatsapp.com/453914586839706/?locale=en_US",
    checked: "2026-11-12",
  },
  whatsappVideoSlow: {
    platform: "WhatsApp",
    appliesTo: "Video sent as media on a slower connection",
    bytes: 64 * MB,
    display: "64 MB at 480p",
    sourceUrl: "https://faq.whatsapp.com/453914586839706/?locale=en_US",
    checked: "2026-11-12",
  },
  whatsappDocument: {
    platform: "WhatsApp",
    appliesTo: "Any file sent as a document",
    bytes: 2 * GB,
    display: "2 GB",
    sourceUrl: "https://faq.whatsapp.com/453914586839706/?locale=en_US",
    checked: "2026-11-12",
  },
  gmail: {
    platform: "Gmail",
    appliesTo: "All attachments in one message, personal accounts",
    bytes: 25 * MB,
    display: "25 MB",
    sourceUrl: "https://support.google.com/mail/answer/6584?hl=en",
    checked: "2026-11-12",
    note: "Larger files are sent as Google Drive links instead.",
  },
  outlook: {
    platform: "Outlook.com",
    appliesTo: "Attachments in one message",
    bytes: 25 * MB,
    display: "25 MB",
    sourceUrl:
      "https://support.microsoft.com/en-au/office/sending-limits-in-outlook-com-279ee200-594c-40f0-9ec8-bb6af7735c2e",
    checked: "2026-11-12",
    note: "Another Microsoft page gives 20 MB for internet email accounts.",
  },
  yahooMail: {
    platform: "Yahoo Mail",
    appliesTo: "All attachments in one message",
    bytes: 25 * MB,
    display: "25 MB",
    sourceUrl: "https://help.yahoo.com/kb/sln5673.html",
    checked: "2026-11-12",
  },
  icloudMail: {
    platform: "iCloud Mail",
    appliesTo: "Whole message, without Mail Drop",
    bytes: 20 * MB,
    display: "20 MB",
    sourceUrl: "https://support.apple.com/102198",
    checked: "2026-11-12",
    note: "Mail Drop sends attachments up to 5 GB as a download link.",
  },
  instagramReels: {
    platform: "Instagram",
    appliesTo: "Reels published through Meta's API",
    bytes: 300 * MB,
    display: "300 MB, up to 15 minutes",
    sourceUrl:
      "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media",
    checked: "2026-11-12",
    note: "From Meta's developer documentation. The Instagram app does not publish its own number.",
  },
  instagramStories: {
    platform: "Instagram",
    appliesTo: "Stories published through Meta's API",
    bytes: 100 * MB,
    display: "100 MB, up to 60 seconds",
    sourceUrl:
      "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media",
    checked: "2026-11-12",
    note: "From Meta's developer documentation. The Instagram app does not publish its own number.",
  },
  telegram: {
    platform: "Telegram",
    appliesTo: "Any file, free account",
    bytes: 2 * GB,
    display: "2 GB",
    sourceUrl: "https://telegram.org/faq",
    checked: "2026-11-12",
  },
  telegramPremium: {
    platform: "Telegram",
    appliesTo: "Any file, Telegram Premium",
    bytes: 4 * GB,
    display: "4 GB",
    sourceUrl: "https://telegram.org/faq",
    checked: "2026-11-12",
  },
  slack: {
    platform: "Slack",
    appliesTo: "Any file added by a member or guest",
    bytes: 1 * GB,
    display: "1 GB",
    sourceUrl: "https://slack.com/help/articles/201330736-Add-files-to-Slack",
    checked: "2026-11-12",
  },
} satisfies Record<string, Limit>;

export type LimitId = keyof typeof limits;
