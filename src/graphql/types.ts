import { gql } from 'mercurius-codegen';

const DocumentFields = gql`
  title: String
  status: DocumentStatus
  createdAt: String
  updatedAt: String
  content: String
`;

export default gql`
  type Document {
    _id: ID
    userId: ID
    title: String
    status: DocumentStatus
    createdAt: String
    updatedAt: String
    content: String
  }

  enum DocumentStatus {
    draft
    published
  }

  input DocumentInput {
    ${DocumentFields}
  }
`;
