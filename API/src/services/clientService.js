import prisma from "../utils/prisma.js";

export async function getClientsPaginated({
  page = 1,
  limit = 10,
  search = "",
  sort = "name",
  order = "asc",
}) {
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const where = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

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


export async function createNewClient(data) {
  return prisma.client.create({ data });
}

export async function updateClientById(id, data) {
  return prisma.client.update({
    where: { id },
    data,
  });
}

export async function deleteClientById(id) {
  return prisma.client.delete({
    where: { id },
  });
}
