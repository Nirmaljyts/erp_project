import prisma from "../utils/prisma.js";

// LIST  CLIENTS + PAGINATION + SERACH
export async function getClientsPaginated({
  page = 1,
  limit = 10,
  search = "",
  sort = "name",
  order = "asc",
}) {
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const cleanSearch = search.trim();
  const whereSearch = cleanSearch ? { name: { contains: cleanSearch } } : {};

  let where = {
    deletedAt: null,
    ...whereSearch,
  };

  const [clients, count] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    data: clients,
    pagination: {
      total: count,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(count / take),
    },
  };
}

// CREATE CLIENT
export async function createNewClient(data) {
  return prisma.client.create({
    data: {
      ...data,
      deletedAt: null,
    },
  });
}

// UPDATE CLIENT
export async function updateClientById(id, data) {
  const existing = await prisma.client.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) throw new Error("Client not found");

  return prisma.client.update({
    where: { id },
    data,
  });
}

// SOFT DELETE CLIENT
export async function deleteClientById(id) {
  const existing = await prisma.client.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) throw new Error("Client not found");

  return prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
