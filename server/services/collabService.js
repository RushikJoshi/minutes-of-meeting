const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

/**
 * Collaboration Service using Hocuspocus.
 * This handles real-time synchronization of the Tiptap editor.
 */
function createCollabServer() {
  const server = new Server({
    name: "mom-collaboration",
    
    // Persistence using MongoDB (via Mongoose connection)
    extensions: [
      new Database({
        fetch: async ({ documentName }) => {
          const db = mongoose.connection.db;
          if (!db) {
            console.error("MongoDB not connected yet");
            return null;
          }
          const collection = db.collection("yjs_documents");
          const doc = await collection.findOne({ name: documentName });
          return doc ? doc.data.buffer : null;
        },
        store: async ({ documentName, state }) => {
          const db = mongoose.connection.db;
          if (!db) return;
          const collection = db.collection("yjs_documents");
          await collection.updateOne(
            { name: documentName },
            { $set: { data: Buffer.from(state), updatedAt: new Date() } },
            { upsert: true }
          );
        },
      }),
    ],

    // Authentication
    async onAuthenticate(data) {
      const { token } = data;
      
      if (!token) {
        throw new Error("Authentication failed: No token provided");
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
          user: {
            id: decoded.id,
            name: decoded.name || "Anonymous",
          },
        };
      } catch (err) {
        throw new Error("Authentication failed: Invalid token");
      }
    },

    // Optional: Log document events
    async onLoadDocument(data) {
      console.log(`Document ${data.documentName} loaded.`);
    },
  });

  return server;
}

/**
 * Safely starts the collab server.
 * Will NOT crash the app if the port is already in use.
 */
async function startCollabServer(server, port) {
  return new Promise((resolve) => {
    server.listen(port)
      .then(() => {
        console.log(`Collaboration server running on port ${port} 🤝`);
        resolve(true);
      })
      .catch((err) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`⚠️  Collab port ${port} already in use — real-time collaboration unavailable.`);
        } else {
          console.error("Collab server failed to start:", err.message);
        }
        resolve(false);
      });

    // Also handle errors on the underlying http server if already attached
    if (server.httpServer) {
      server.httpServer.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`⚠️  Collab port ${port} busy (httpServer event).`);
        }
      });
    }
  });
}

module.exports = { createCollabServer, startCollabServer };
