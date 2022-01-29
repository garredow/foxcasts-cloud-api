import { gql } from 'mercurius-codegen';

export const Query = gql`
  type Query {
    search(query: String!, count: Int): [Podcast!]!
    podcast(podexId: BigInt!, episodeCount: Int): Podcast
    episode(podexId: BigInt!): Episode
  }
`;
