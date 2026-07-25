const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    include: { accounts: true, sessions: true },
  });
  console.log(
    JSON.stringify(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        accounts: u.accounts.length,
        sessions: u.sessions.length,
        providers: u.accounts.map((a) => a.provider),
      })),
      null,
      2
    )
  );

  // Orphan userlarni tozalash: account bog'lanmaganlar
  for (const u of users) {
    if (u.accounts.length === 0) {
      await p.session.deleteMany({ where: { userId: u.id } });
      await p.user.delete({ where: { id: u.id } });
      console.log("Deleted orphan user:", u.email || u.id);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });
