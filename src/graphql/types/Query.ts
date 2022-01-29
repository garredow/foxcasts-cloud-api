import { gql } from 'mercurius-codegen';

export const Query = gql`
  type Query {
    user: User!
    search(query: String!, count: Int): [Podcast!]!
    podcast(id: BigInt!, episodeCount: Int): Podcast
    episode(id: BigInt!): Episode
  }
`;
