import { gql } from 'mercurius-codegen';

export const Query = gql`
  type Query {
    hello(name: String!): String
    podcast(podexId: Int!): Podcast
  }
`;
