import "server-only";
import { MongoClient } from "mongodb";
import type { ContactValues } from "@/lib/contact";

interface ContactInquiry extends ContactValues {
  createdAt: Date;
  source: "portfolio-contact-form";
  status: "new";
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!globalForMongo.mongoClientPromise) {
    const connection = new MongoClient(uri).connect();
    globalForMongo.mongoClientPromise = connection;
    void connection.catch(() => {
      if (globalForMongo.mongoClientPromise === connection) {
        delete globalForMongo.mongoClientPromise;
      }
    });
  }
  return globalForMongo.mongoClientPromise;
}

export async function storeContactInquiry(values: ContactValues): Promise<void> {
  const client = await getMongoClient();
  const databaseName = process.env.MONGODB_DB?.trim() || "portfolio";

  await client
    .db(databaseName)
    .collection<ContactInquiry>("contact_inquiries")
    .insertOne({
      ...values,
      createdAt: new Date(),
      source: "portfolio-contact-form",
      status: "new",
    });
}
