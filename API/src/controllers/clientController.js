import {
  getClientsPaginated,
  createNewClient,
  updateClientById,
  deleteClientById,
} from "../services/clientService.js";

export async function listClients(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = 10;
    const { clients, totalPages } = await getClientsPaginated(page, limit);

    return res.json({
      data: clients,
      pagination: {
        page,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list clients" });
  }
}

export async function createClient(req, res) {
  try {
    const client = await createNewClient(req.body);
    res.status(201).json(client);
  } catch (err) {
    console.error("CREATE CLIENT ERROR:", err);
    res.status(500).json({
      message: "Failed to create client",
      error: err.message, // TEMP
      meta: err.meta || null, // TEMP
    });
  }
}

export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const client = await updateClientById(Number(id), req.body);
    return res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update client" });
  }
}

export async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    await deleteClientById(Number(id));
    return res.json({ message: "Client deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete client" });
  }
}
