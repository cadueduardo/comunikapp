"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const tables = ['localizacoes', 'itens_estoque', 'estoque_lotes'];
    for (const t of tables) {
        try {
            const cols = await prisma.$queryRawUnsafe(`DESCRIBE ${t}`);
            console.log(`\n=== ${t} ===`);
            for (const c of cols) {
                console.log(`${c.Field || c.COLUMN_NAME}\t${c.Type || ''}`);
            }
        }
        catch (e) {
            console.error('Erro ao descrever tabela', t, e);
        }
    }
    await prisma.$disconnect();
}
run();
//# sourceMappingURL=inspect_table.js.map