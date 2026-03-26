import { describe, expect, it } from "vitest";
import { mapQuoteDtoToDevisRow } from "@/lib/mappers";
import type { QuoteDto, QuoteStatus } from "@/lib/api/services";

function buildQuote(status: QuoteStatus): QuoteDto {
  return {
    id: "quote-id",
    publicReference: "DEV-20260326-1234",
    requesterType: "PARTICULIER",
    requesterName: "Alice Martin",
    requesterEmail: "alice@example.com",
    requesterPhone: "0600000000",
    pickupCity: "Puteaux",
    requestedVehicleType: "SUV",
    requestedQuantity: 1,
    startAt: "2026-04-01T08:00:00.000Z",
    endAt: "2026-04-05T08:00:00.000Z",
    status,
    amountTtc: 0,
    currency: "EUR",
    createdAt: "2026-03-26T08:00:00.000Z",
  };
}

describe("mapQuoteDtoToDevisRow", () => {
  it("maps lifecycle statuses to admin labels", () => {
    const cases: Array<[QuoteStatus, string]> = [
      ["NOUVELLE_DEMANDE", "en attente"],
      ["EN_ANALYSE", "en analyse"],
      ["PROPOSITION_ENVOYEE", "proposition envoyee"],
      ["EN_NEGOCIATION", "en negociation"],
      ["EN_ATTENTE_PAIEMENT", "en attente paiement"],
      ["PAYEE", "paye"],
      ["CONVERTI_RESERVATION", "converti"],
      ["REFUSEE", "refuse"],
      ["ANNULEE", "annule"],
    ];

    for (const [status, expectedLabel] of cases) {
      const mapped = mapQuoteDtoToDevisRow(buildQuote(status));
      expect(mapped.statut).toBe(expectedLabel);
      expect(mapped.publicReference).toBe("DEV-20260326-1234");
      expect(mapped.backendStatus).toBe(status);
    }
  });
});
