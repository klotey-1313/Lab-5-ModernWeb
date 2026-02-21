import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import expressLayouts from "express-ejs-layouts";

import clientRoutes from "./routes/clientRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ES module __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Views root
const viewsRoot = path.join(__dirname, "views");

app.set("view engine", "ejs");
app.set("views", viewsRoot);

app.engine("ejs", (filePath, options, callback) => {
  const renderOptions = {
    ...options,
    filename: filePath,      
    root: [viewsRoot]        
  };
  ejs.renderFile(filePath, renderOptions, callback);
});

app.use(expressLayouts);
app.set("layout", "layouts/main");

// Static assets (CSS, images)
app.use(express.static(path.join(__dirname, "public")));

// Serve future AngularJS frontend folder 
app.use("/app", express.static(path.join(__dirname, "..", "frontend")));

// Routes (SSR + API)
app.use("/", clientRoutes);

// 404 handler
app.use((req, res) => {
  // API 404 should be JSON
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found", path: req.path });
  }

  // SSR 404 page 
  return res.status(404).render("pages/home", {
    pageTitle: "Not Found",
    message: "The page you requested does not exist.",
    now: new Date().toLocaleString()
  });
});

// Start
app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
  console.log(`SSR: /, /clients, /clients/:id`);
  console.log(`API: /api/clients, /api/clients/:id`);
  console.log(`Frontend placeholder: /app`);
});
