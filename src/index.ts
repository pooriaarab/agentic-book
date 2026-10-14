export { VERSION } from "./version.js";
export { createBookingGuards, findSlots, bookMeeting } from "./book.js";
export type { BookingVendor, TimeSlot, AvailabilityRequest, AvailabilityResult, BookingRequest, BookingReceipt } from "./book.js";
export { defineBrand, createLogger, GuardError, VendorError, createGuards, recordCost, getCostReport, resetCosts } from "agentic-core";
export type { BrandConfig, Guards, GuardsConfig, Logger } from "agentic-core";
import { defineBrand, type BrandConfig } from "agentic-core";
import { VERSION } from "./version.js";
export const DEFAULT_BRAND: BrandConfig = defineBrand({
  name: "Agentic book",
  command: "agentic-book",
  description: "Offer open slots and book meetings across calendar vendors.",
  keywords: ["calendar", "booking", "scheduling", "google-calendar", "calcom", "calendly", "cli", "mcp"],
  version: VERSION,
});
