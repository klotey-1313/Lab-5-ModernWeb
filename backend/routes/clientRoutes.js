import express from "express";
import {
  renderHome,
  renderClientsList,
  renderClientDetails,
  renderClientCreateForm,
  createClient,
  renderClientEditForm,
  updateClient,
  renderClientDeleteConfirm,
  deleteClient,
  apiGetClients,
  apiGetClientById,
  apiCreateClient,
  apiUpdateClient,
  apiDeleteClient
} from "../controllers/clientController.js";

const router = express.Router();

// SSR routes
router.get("/", renderHome);
router.get("/clients", renderClientsList);
router.get("/clients/new", renderClientCreateForm);
router.post("/clients", createClient);
router.get("/clients/:id", renderClientDetails);
router.get("/clients/:id/edit", renderClientEditForm);
router.post("/clients/:id", updateClient);
router.get("/clients/:id/delete", renderClientDeleteConfirm);
router.post("/clients/:id/delete", deleteClient);

// API routes (AngularJS-ready)
router.get("/api/clients", apiGetClients);
router.get("/api/clients/:id", apiGetClientById);
router.post("/api/clients", apiCreateClient);
router.put("/api/clients/:id", apiUpdateClient);
router.delete("/api/clients/:id", apiDeleteClient);

export default router;
