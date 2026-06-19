const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./utils/connectDB");
const { notFound, errorHandler } = require("./utils/errorMiddleware");
const { loadConfig } = require("./config/env");

const app = express();

/* ===========================
   Middlewares
=========================== */
app.use(express.json());

app.use(
   cors({
      origin: true,
      credentials: true,
   })
);

/* ===========================
   Routes Imports
=========================== */
const meetingRoutes = require("./routes/meetingRoutes");
const momRoutes = require("./routes/momRoutes");
const shareRoutes = require("./routes/shareRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const actionItemRoutes = require("./routes/actionItemRoutes");
const aiRoutes = require("./routes/aiRoutes");
const editorTemplateRoutes = require("./routes/editorTemplateRoutes");
const apiKeyRoutes = require("./routes/apiKeyRoutes");
const contactRoutes = require("./routes/contactRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

/* ===========================
   TEST ROUTES
=========================== */

// Root Route
app.get("/", (req, res) => {
   res.json({ status: "ok", message: "MOM Backend Running" });
});

/* ===========================
   Main Routes (/api/v1)
=========================== */
const apiRouter = express.Router();

apiRouter.use(meetingRoutes);
apiRouter.use(momRoutes);
apiRouter.use(shareRoutes);
apiRouter.use(pdfRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use(userRoutes);
apiRouter.use(attachmentRoutes);
apiRouter.use(integrationRoutes);
apiRouter.use(notificationRoutes);
apiRouter.use(organizationRoutes);
apiRouter.use(actionItemRoutes);
apiRouter.use(aiRoutes);
apiRouter.use(editorTemplateRoutes);
apiRouter.use(reportRoutes);
apiRouter.use(apiKeyRoutes);
apiRouter.use("/contacts", contactRoutes);
apiRouter.use(dashboardRoutes); // Added dashboardRoutes

// Add meeting routes (if explicitly prefixed)
apiRouter.use("/meetings", meetingRoutes);

// Mount the v1 API
app.use("/api/v1", apiRouter);

// OAuth redirect URIs are configured without /api/v1.
// Keep these callback aliases so provider settings continue to work.
const { microsoftCallback } = require("./controllers/integrationController");
const { googleCallback } = require("./controllers/googleController");
app.get("/integrations/microsoft/callback", microsoftCallback);
app.get("/integrations/google/callback", googleCallback);

/* ===========================
   Static Uploads
=========================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===========================
   Error Middleware
=========================== */
app.use(notFound);
app.use(errorHandler);

/* ===========================
   SERVER START
=========================== */
const cfg = loadConfig();
const PORT = cfg.port;

const { startReminderLoop } = require("./services/reminderService");

connectDB(process.env.MONGO_URI)
   .then(() => {
      console.log("MongoDB Connected ✅");

      app.listen(PORT, () => {
         console.log(`Server running on port ${PORT} 🚀`);

         startReminderLoop();

         // Collaboration Server (safe — won't crash on port conflict)
         const { createCollabServer, startCollabServer } = require("./services/collabService");
         const collabServer = createCollabServer();
         const COLLAB_PORT = cfg.collabPort;
         startCollabServer(collabServer, COLLAB_PORT);
      });
   })
   .catch((err) => {
      console.error("Mongo Error:", err?.message || err);
      process.exit(1);
   });
