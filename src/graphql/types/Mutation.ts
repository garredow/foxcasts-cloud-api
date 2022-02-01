import { gql } from 'mercurius-codegen';

export const Mutation = gql`
  type Mutation {
    subscribe(podcastId: BigInt!): Int
    unsubscribe(podcastId: BigInt!): Int
  }
`;
