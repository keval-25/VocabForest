import { MongoClient, Collection, Db } from 'mongodb';
import { WordItem } from '@/types/word';

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'vocabforest';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured() || !uri) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri);
      clientPromise = client.connect();
    }
  }

  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(DB_NAME);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    return null;
  }
}

export async function getMongoWordsCollection(): Promise<Collection<WordItem> | null> {
  const db = await getMongoDb();
  if (!db) return null;
  return db.collection<WordItem>('words');
}
