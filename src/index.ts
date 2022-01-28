import arg from 'arg';
import dotenv from 'dotenv';
import mercuriusCodegen from 'mercurius-codegen';
import { configureServer } from './server';

dotenv.config();

const args = arg({
  '--port': Number,
  '-p': '--port',
});

const server = configureServer();

mercuriusCodegen(server, {
  // Commonly relative to your root package.json
  targetPath: './src/graphql/generated.ts',
}).catch(console.error);

server.listen(args['--port'] || 3000, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
});
