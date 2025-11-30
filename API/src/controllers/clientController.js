import {
  getClientsPaginated,
  createNewClient,
  updateClientById,
  deleteClientById,
} from "../services/clientService.js";


// LIST  CLIENTS + PAGINATION + SERACH
export async function listClients(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search || "";
    const sort = req.query.sort || "name";
    const order = req.query.order || "asc";

    const result = await getClientsPaginated({
      page,
      limit,
      search,
      sort,
      order,
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list clients" });
  }
}



// CREATE CLIENT
export async function createClient(req, res) {
  try {
    const client = await createNewClient(req.body);
    res.status(201).json(client);
  } catch (err) {
    console.error("CREATE CLIENT ERROR:", err);
    res.status(500).json({
      message: "Failed to create client",
      error: err.message,
      meta: err.meta || null,
    });
  }
}



// UPDATE CLIENT
export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const client = await updateClientById(Number(id), req.body);
    return res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to update client" });
  }
}



// DELETE CLIENT(SOFT DELETE)
export async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    await deleteClientById(Number(id));
    return res.json({ message: "Client deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to delete client" });
  }
}
