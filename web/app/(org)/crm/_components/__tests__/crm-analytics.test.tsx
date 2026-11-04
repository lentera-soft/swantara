import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PipelineForecast } from "@/lib/services/swantara";
import { renderWithProviders } from "@/lib/tests";
import { CrmAnalytics } from "../crm-analytics";

const forecast: PipelineForecast = {
  totalExpectedRevenue: 50000,
  weightedPipeline: 30000,
  winRate: 50,
  commitRevenue: 10000,
  bestCaseRevenue: 20000,
  pipelineRevenue: 20000,
  weightedCommit: 6000,
  weightedBestCase: 12000,
  weightedPipelineOnly: 12000,
  averageDealSize: 25000,
  averageSalesCycleDays: 45,
  leadFunnel: {
    total: 10,
    leadTotal: 10,
    opportunityTotal: 4,
    won: 2,
    lost: 1,
    new: 2,
    contacted: 2,
    qualified: 3,
    nurtured: 1,
    disqualified: 1,
    converted: 1,
    qualificationRate: 40,
    conversionRate: 10,
    averageResponseHours: 6,
    averageLeadToOpportunityDays: 9.5,
    responseSlaHours: 24,
    responseSlaBreached: 2,
    responseSlaAtRisk: 1,
  },
  stages: [
    {
      stageId: 1,
      stageName: "Qualified",
      probability: 35,
      isWon: false,
      isLost: false,
      opportunityCount: 2,
      expectedRevenue: 50000,
      weightedRevenue: 17500,
      averageAgeDays: 12,
      averageVelocityDays: 5,
    },
  ],
  sources: [
    {
      source: "website",
      leadCount: 8,
      opportunityCount: 3,
      wonCount: 1,
      lostCount: 1,
      expectedRevenue: 50000,
      wonRevenue: 20000,
      qualifiedCount: 3,
      qualificationRate: 37.5,
      opportunityWinRate: 50,
    },
  ],
  owners: [
    {
      ownerUserId: null,
      ownerName: "",
      salespersonId: 4,
      salesGroupId: 2,
      opportunityCount: 3,
      wonCount: 1,
      lostCount: 1,
      expectedRevenue: 50000,
      wonRevenue: 20000,
      winRate: 50,
    },
  ],
  lostReasons: [{ code: "", reason: "Price too high", count: 1 }],
};

describe("CrmAnalytics", () => {
  it("renders source, owner, lost-reason, velocity, and cycle time metrics", () => {
    renderWithProviders(<CrmAnalytics pipeline={forecast} />);

    expect(screen.getByText("Waktu prospek jadi peluang")).toBeInTheDocument();
    expect(screen.getByText("9,5 hari")).toBeInTheDocument();
    expect(screen.getByText("Sumber prospek")).toBeInTheDocument();
    expect(screen.getByText("website")).toBeInTheDocument();
    expect(screen.getByText("Performa tim")).toBeInTheDocument();
    expect(screen.getByText("#4 · #2")).toBeInTheDocument();
    expect(screen.getByText("Mengapa kita kalah")).toBeInTheDocument();
    expect(screen.getByText("Price too high")).toBeInTheDocument();
    expect(screen.getByText("Pergerakan per tahap")).toBeInTheDocument();
  });
});
