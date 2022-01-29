import { gql } from 'mercurius-codegen';

export const User = gql`
  type User {
    id: String!
    name: String
    email: String
    avatarUrl: String

    subscriptions: [Podcast!]!

    createdAt: BigInt!
    updatedAt: BigInt!
  }
`;
