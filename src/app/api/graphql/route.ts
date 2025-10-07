/**
 * GraphQL API Route for Next.js 15
 * Handles GraphQL queries and mutations
 */

import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

import { resolvers, type Context } from '@/lib/graphql/resolvers';
import { typeDefs } from '@/lib/graphql/schema';
import type { Server } from '@/types';

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: Request): Promise<Context> => {
    // Extract server from headers or default to Americas
    const serverHeader = req.headers.get('x-albion-server') as Server | null;
    return {
      server: serverHeader || 'Americas',
    };
  },
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
