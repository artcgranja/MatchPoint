import type { SearchQuery } from "@/types";

export const mockSearches: SearchQuery[] = [
  {
    id: "search-1",
    painPoint:
      "We need an AI solution to automate our customer support workflow and reduce response times by 50%",
    filters: {
      industries: ["AI/ML"],
      fundingStages: ["Series A", "Series B"],
      locations: [],
      minMatchScore: 70,
      maxEmployeeCount: 500,
      technologies: [],
    },
    timestamp: "2024-01-15T10:30:00Z",
    status: "complete",
    resultCount: 8,
  },
  {
    id: "search-2",
    painPoint:
      "Looking for blockchain-based supply chain tracking to improve transparency across our manufacturing network",
    filters: {
      industries: ["FinTech", "Logistics"],
      fundingStages: [],
      locations: [],
      minMatchScore: 60,
      maxEmployeeCount: 1000,
      technologies: ["Blockchain"],
    },
    timestamp: "2024-01-12T14:15:00Z",
    status: "complete",
    resultCount: 5,
  },
  {
    id: "search-3",
    painPoint:
      "Need a cybersecurity platform that provides real-time threat detection for our cloud infrastructure",
    filters: {
      industries: ["Cybersecurity"],
      fundingStages: ["Series A", "Series B", "Series C"],
      locations: [],
      minMatchScore: 75,
      maxEmployeeCount: 300,
      technologies: [],
    },
    timestamp: "2024-01-10T09:00:00Z",
    status: "complete",
    resultCount: 4,
  },
  {
    id: "search-4",
    painPoint:
      "Seeking health data analytics platform to improve patient outcomes prediction in our hospital network",
    filters: {
      industries: ["HealthTech"],
      fundingStages: [],
      locations: [],
      minMatchScore: 65,
      maxEmployeeCount: 200,
      technologies: ["Machine Learning"],
    },
    timestamp: "2024-01-08T16:45:00Z",
    status: "complete",
    resultCount: 6,
  },
  {
    id: "search-5",
    painPoint:
      "Exploring clean energy solutions for our manufacturing facilities to meet 2030 carbon neutrality goals",
    filters: {
      industries: ["CleanTech"],
      fundingStages: [],
      locations: [],
      minMatchScore: 50,
      maxEmployeeCount: 500,
      technologies: [],
    },
    timestamp: "2024-01-05T11:20:00Z",
    status: "complete",
    resultCount: 3,
  },
  {
    id: "search-6",
    painPoint:
      "Want to implement an AI-powered learning platform for upskilling our 10,000+ employee workforce",
    filters: {
      industries: ["EdTech", "AI/ML"],
      fundingStages: ["Seed", "Series A"],
      locations: [],
      minMatchScore: 60,
      maxEmployeeCount: 150,
      technologies: [],
    },
    timestamp: "2024-01-03T13:00:00Z",
    status: "complete",
    resultCount: 7,
  },
];
