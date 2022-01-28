import { gql } from 'mercurius-codegen';

export const Podcast = gql`
  type Podcast {
    id: ID
    title: String!
    podexId: Int!
  }
`;
