import { gql } from 'mercurius-codegen';

export const Category = gql`
  type Category {
    podexId: BigInt!
    title: String!
  }
`;
