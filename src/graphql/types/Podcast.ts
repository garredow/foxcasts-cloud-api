import { gql } from 'mercurius-codegen';

export const Podcast = gql`
  type Podcast {
    podexId: BigInt!
    itunesId: BigInt
    title: String!
    author: String!
    description: String
    artworkUrl: String!
    feedUrl: String!

    episodes(count: Int!): [Episode!]!
    # categories: [Category!]!

    createdAt: Int!
    updatedAt: Int!
  }
`;
