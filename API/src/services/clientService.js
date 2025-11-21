import prisma from "../utils/prisma.js";

export async function getClientsPaginated(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [clients, count] = await Promise.all([
    prisma.client.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count(),
  ]);

  return {
    clients,
    totalPages: Math.ceil(count / limit),
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
