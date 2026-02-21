import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES module __dirname replacement (for controllers folder)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadClients = () => {
  const dataPath = path.join(__dirname, "..", "data", "clients.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

const saveClients = (clients) => {
  const dataPath = path.join(__dirname, "..", "data", "clients.json");
  fs.writeFileSync(dataPath, JSON.stringify(clients, null, 2), "utf-8");
};

const normalizeRiskCategory = (value) => {
  const v = String(value || "").trim();
  const allowed = ["Low", "Medium", "High"];
  // Accept lowercase inputs too
  const match = allowed.find(a => a.toLowerCase() === v.toLowerCase());
  return match || "";
};

const isValidEmail = (email) => {
  const e = String(email || "").trim();
  // Lightweight validation (good enough for a lab)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

const todayISODate = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const findClientById = (clients, id) =>
  clients.find(c => String(c.id) === String(id));

// SSR: Home
export const renderHome = (req, res) => {
  res.render("pages/home", {
    pageTitle: "Home",
    message:
      "This portal demonstrates dynamic server-side rendering using EJS layouts and partials. JSON APIs are available for an AngularJS frontend that will be added later.",
    now: new Date().toLocaleString()
  });
};

// SSR: Clients list
export const renderClientsList = (req, res) => {
  const clients = loadClients();

  res.render("pages/clients", {
    pageTitle: "Clients",
    clients,
    totalClients: clients.length,
    now: new Date().toLocaleString()
  });
};

// SSR: Client details
export const renderClientDetails = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);
  if (!clientt) {
    return res.status(404).render("pages/home", {
      pageTitle: "Client Not Found",
      message: `No client record found for id: ${req.params.id}`,
      now: new Date().toLocaleString()
    });
  }
  
  res.render("pages/clientDetails", {
    pageTitle: "Client Profile",
    clientt,
    now: new Date().toLocaleString()
  });
};

// API: all clients
export const apiGetClients = (req, res) => {
  const clients = loadClients();
  res.json({ total: clients.length, clients });
};

// API: client by id
export const apiGetClientById = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);

  if (!clientt) {
    return res.status(404).json({ error: "Client Not Found", id: req.params.id });
  }

  res.json({ clientt });
};

// -----------------------------
// SSR: Create
// -----------------------------

export const renderClientCreateForm = (req, res) => {
  res.render("pages/clientCreate", {
    pageTitle: "Create Client",
    errors: [],
    form: { fullName: "", email: "", riskCategory: "Low" },
    now: new Date().toLocaleString()
  });
};

export const createClient = (req, res) => {
  const clients = loadClients();

  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim();
  const riskCategory = normalizeRiskCategory(req.body.riskCategory);

  const errors = [];
  if (!fullName) errors.push("Full name is required.");
  if (!email) errors.push("Email is required.");
  else if (!isValidEmail(email)) errors.push("Email format is invalid.");
  if (!riskCategory) errors.push("Risk category must be Low, Medium, or High.");

  if (errors.length) {
    return res.status(400).render("pages/clientCreate", {
      pageTitle: "Create Client",
      errors,
      form: { fullName, email, riskCategory: riskCategory || "Low" },
      now: new Date().toLocaleString()
    });
  }

  const maxId = clients.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
  const nextId = maxId + 1;

  const newClient = {
    id: nextId,
    fullName,
    email,
    riskCategory,
    createdDate: todayISODate()
  };

  clients.push(newClient);
  saveClients(clients);

  return res.redirect(`/clients/${nextId}`);
};

// -----------------------------
// SSR: Update
// -----------------------------

export const renderClientEditForm = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);

  if (!clientt) {
    return res.status(404).render("pages/home", {
      pageTitle: "Client Not Found",
      message: `No client record found for id: ${req.params.id}`,
      now: new Date().toLocaleString()
    });
  }

  return res.render("pages/clientEdit", {
    pageTitle: "Edit Client",
    errors: [],
    clientt,
    form: {
      fullName: clientt.fullName,
      email: clientt.email,
      riskCategory: clientt.riskCategory
    },
    now: new Date().toLocaleString()
  });
};

export const updateClient = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);

  if (!clientt) {
    return res.status(404).render("pages/home", {
      pageTitle: "Client Not Found",
      message: `No client record found for id: ${req.params.id}`,
      now: new Date().toLocaleString()
    });
  }

  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim();
  const riskCategory = normalizeRiskCategory(req.body.riskCategory);

  const errors = [];
  if (!fullName) errors.push("Full name is required.");
  if (!email) errors.push("Email is required.");
  else if (!isValidEmail(email)) errors.push("Email format is invalid.");
  if (!riskCategory) errors.push("Risk category must be Low, Medium, or High.");

  if (errors.length) {
    return res.status(400).render("pages/clientEdit", {
      pageTitle: "Edit Client",
      errors,
      clientt,
      form: { fullName, email, riskCategory: riskCategory || clientt.riskCategory },
      now: new Date().toLocaleString()
    });
  }

  clientt.fullName = fullName;
  clientt.email = email;
  clientt.riskCategory = riskCategory;

  saveClients(clients);
  return res.redirect(`/clients/${clientt.id}`);
};

// -----------------------------
// SSR: Delete
// -----------------------------

export const renderClientDeleteConfirm = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);

  if (!clientt) {
    return res.status(404).render("pages/home", {
      pageTitle: "Client Not Found",
      message: `No client record found for id: ${req.params.id}`,
      now: new Date().toLocaleString()
    });
  }

  return res.render("pages/clientDelete", {
    pageTitle: "Delete Client",
    clientt,
    now: new Date().toLocaleString()
  });
};

export const deleteClient = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);

  if (!clientt) {
    return res.status(404).render("pages/home", {
      pageTitle: "Client Not Found",
      message: `No client record found for id: ${req.params.id}`,
      now: new Date().toLocaleString()
    });
  }

  const remaining = clients.filter(c => String(c.id) !== String(req.params.id));
  saveClients(remaining);
  return res.redirect("/clients");
};

// -----------------------------
// API: Create / Update / Delete
// -----------------------------

export const apiCreateClient = (req, res) => {
  const clients = loadClients();
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim();
  const riskCategory = normalizeRiskCategory(req.body.riskCategory);

  const errors = [];
  if (!fullName) errors.push("fullName is required");
  if (!email) errors.push("email is required");
  else if (!isValidEmail(email)) errors.push("email format is invalid");
  if (!riskCategory) errors.push("riskCategory must be Low, Medium, or High");

  if (errors.length) return res.status(400).json({ error: "ValidationError", details: errors });

  const maxId = clients.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
  const nextId = maxId + 1;

  const newClient = {
    id: nextId,
    fullName,
    email,
    riskCategory,
    createdDate: todayISODate()
  };
  clients.push(newClient);
  saveClients(clients);

  return res.status(201).json({ clientt: newClient });
};

export const apiUpdateClient = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);
  if (!clientt) return res.status(404).json({ error: "Client Not Found", id: req.params.id });

  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim();
  const riskCategory = normalizeRiskCategory(req.body.riskCategory);

  const errors = [];
  if (!fullName) errors.push("fullName is required");
  if (!email) errors.push("email is required");
  else if (!isValidEmail(email)) errors.push("email format is invalid");
  if (!riskCategory) errors.push("riskCategory must be Low, Medium, or High");

  if (errors.length) return res.status(400).json({ error: "ValidationError", details: errors });

  clientt.fullName = fullName;
  clientt.email = email;
  clientt.riskCategory = riskCategory;
  saveClients(clients);

  return res.json({ clientt });
};

export const apiDeleteClient = (req, res) => {
  const clients = loadClients();
  const clientt = findClientById(clients, req.params.id);
  if (!clientt) return res.status(404).json({ error: "Client Not Found", id: req.params.id });

  const remaining = clients.filter(c => String(c.id) !== String(req.params.id));
  saveClients(remaining);
  return res.status(204).send();
};
