import { gql } from 'mercurius-codegen';

export const Episode = gql`
  type Episode {
    podexId: BigInt!
    podcastPodexId: BigInt!
    date: String!
    title: String!
    description: String
    duration: Int
    fileSize: Int
    fileType: String
    fileUrl: String
    chaptersUrl: String
    transcriptUrl: String
    season: Int
    episode: Int
    episodeType: String
    imageUrl: String

    podcast: Podcast!

    createdAt: Int!
    updatedAt: Int!
  }
`;
