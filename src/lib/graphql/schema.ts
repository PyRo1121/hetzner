/**
 * GraphQL Schema Definition
 * Federates data from AODP and Gameinfo APIs
 */

import gql from 'graphql-tag';

export const typeDefs = gql`
  # Market Price Data
  type MarketPrice {
    itemId: String!
    itemName: String!
    city: String!
    quality: Int!
    sellPriceMin: Int!
    sellPriceMax: Int!
    buyPriceMin: Int!
    buyPriceMax: Int!
    timestamp: String!
    server: String!
  }

  # Historical Price Data
  type PriceHistory {
    itemId: String!
    location: String!
    quality: Int!
    data: [PriceDataPoint!]!
  }

  type PriceDataPoint {
    timestamp: String!
    avgPrice: Int!
    itemCount: Int!
  }

  # Gold Price
  type GoldPrice {
    price: Int!
    timestamp: String!
    server: String!
  }

  # Player Data
  type Player {
    id: String!
    name: String!
    guildId: String
    guildName: String
    allianceId: String
    allianceName: String
    killFame: Int
    deathFame: Int
    fameRatio: Float
  }

  # Guild Data
  type Guild {
    id: String!
    name: String!
    allianceId: String
    allianceName: String
    allianceTag: String
    founderId: String
    founderName: String
    founded: String
    memberCount: Int
    killFame: Int
    deathFame: Int
  }

  # Battle Data
  type Battle {
    id: Int!
    startTime: String!
    endTime: String!
    totalKills: Int!
    totalFame: Int!
  }

  # Item Data
  type Item {
    uniqueName: String!
    localizedName: String!
    tier: Int
    category: String
    iconUrl: String
  }

  # Search Results
  type SearchResult {
    players: [PlayerSearchResult!]
    guilds: [GuildSearchResult!]
  }

  type PlayerSearchResult {
    id: String!
    name: String!
  }

  type GuildSearchResult {
    id: String!
    name: String!
  }

  # Global Search Results
  type GlobalSearchResult {
    items: [ItemSearchResult!]
    players: [PlayerSearchResult!]
    guilds: [GuildSearchResult!]
  }

  type ItemSearchResult {
    id: String!
    name: String!
    description: String
    iconUrl: String
  }

  # Pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type MarketPriceConnection {
    edges: [MarketPriceEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MarketPriceEdge {
    node: MarketPrice!
    cursor: String!
  }

  # Queries
  type Query {
    # Market Data
    marketPrices(
      itemIds: [String!]!
      locations: [String!]
      qualities: [Int!]
      server: String
      first: Int
      after: String
    ): MarketPriceConnection!

    priceHistory(
      itemIds: [String!]!
      startDate: String
      endDate: String
      locations: [String!]
      qualities: [Int!]
      timeScale: Int
      server: String
    ): [PriceHistory!]!

    goldPrices(
      startDate: String
      endDate: String
      count: Int
      server: String
    ): [GoldPrice!]!

    # Player & Guild Data
    searchPlayers(query: String!): SearchResult!
    player(id: String!): Player
    guild(id: String!): Guild
    battles(limit: Int, offset: Int): [Battle!]!

    # Items
    searchItems(query: String!, locale: String, limit: Int): [Item!]!
    item(uniqueName: String!): Item

    # Global Search
    search(query: String!, limit: Int): GlobalSearchResult!
  }

  # Subscriptions for real-time updates
  type Subscription {
    priceUpdated(itemId: String!): MarketPrice!
    goldPriceUpdated: GoldPrice!
  }
`;
