import { PIApiFeed } from 'podcastdx-client/dist/src/types';
import { SearchResult } from '../models';

export function toSearchResult(source: PIApiFeed): SearchResult {
  return {
    id: source.id,
    title: source.title,
    author: source.author,
    feedUrl: source.url,
    artworkUrl: source.artwork || source.image,
    imageUrlHash: source.imageUrlHash,
  };
}
