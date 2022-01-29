import { gql } from 'mercurius-codegen';

export const Podcast = gql`
  type Podcast {
    id: BigInt!
    itunesId: BigInt
    title: String!
    author: String!
    description: String
    artworkUrl: String!
    feedUrl: String!

    episodes(count: Int!): [Episode!]!
    # categories: [Category!]!

    createdAt: BigInt!
    updatedAt: BigInt!
  }
`;
