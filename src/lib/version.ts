import { CHANGELOG } from "@/lib/changelog";

/** The newest release in the changelog. Bump by adding an entry in src/lib/changelog.ts. */
export const APP_VERSION = CHANGELOG[0].version;
