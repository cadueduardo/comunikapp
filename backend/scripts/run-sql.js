"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = require("fs");
const path_1 = require("path");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const sqlPath = (0, path_1.join)(__dirname, '..', 'sql', 'create_estoque_lotes_if_not_exists.sql');
        const sql = (0, fs_1.readFileSync)(sqlPath, 'utf8');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(Boolean);
        for (const stmt of statements) {
            await prisma.$executeRawUnsafe(stmt);
        }
        console.log('✅ Tabela estoque_lotes verificada/criada com sucesso');
    }
    catch (e) {
        console.error('❌ Falha ao executar SQL:', e.message);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=run-sql.js.map