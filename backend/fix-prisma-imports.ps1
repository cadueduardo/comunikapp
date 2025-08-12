# Script para corrigir imports do Prisma após db pull
# Execute: .\fix-prisma-imports.ps1

Write-Host "Corrigindo imports do Prisma..." -ForegroundColor Green

# Lista de arquivos para corrigir
$files = @(
    "src/auth/auth.service.ts",
    "src/auth/decorators.ts", 
    "src/categorias/categorias.controller.ts",
    "src/categorias/categorias.service.ts",
    "src/clientes/clientes.service.ts",
    "src/clientes/dto/create-cliente.dto.ts",
    "src/custos-indiretos/custos-indiretos.service.ts",
    "src/fornecedores/fornecedores.controller.ts",
    "src/fornecedores/fornecedores.service.ts",
    "src/funcoes/funcoes.service.ts",
    "src/insumos/insumos.controller.ts",
    "src/insumos/insumos.service.ts",
    "src/lojas/lojas.service.ts",
    "src/maquinas/maquinas.controller.ts",
    "src/maquinas/maquinas.service.ts",
    "src/mensagens-negociacao/mensagens-negociacao.service.ts",
    "src/notificacoes/notificacoes.service.ts",
    "src/orcamentos/orcamentos.service.ts",
    "src/tipos-material/tipos-material.controller.ts",
    "src/tipos-material/tipos-material.service.ts"
)

Write-Host "Arquivos que serão corrigidos:" -ForegroundColor Yellow
$files | ForEach-Object { Write-Host "- $_" -ForegroundColor White }

Write-Host "`nCorreções necessárias:" -ForegroundColor Cyan
Write-Host "1. Loja -> loja" -ForegroundColor White
Write-Host "2. custoIndireto -> custoindireto" -ForegroundColor White
Write-Host "3. itemOrcamento -> itemorcamento" -ForegroundColor White
Write-Host "4. maquinaOrcamento -> maquinaorcamento" -ForegroundColor White
Write-Host "5. funcaoOrcamento -> funcaoorcamento" -ForegroundColor White
Write-Host "6. mensagemNegociacao -> mensagemnegociacao" -ForegroundColor White
Write-Host "7. anexoMensagem -> anexomensagem" -ForegroundColor White
Write-Host "8. tipoMaterial -> tipomaterial" -ForegroundColor White

Write-Host "`nExecute manualmente as correções:" -ForegroundColor Yellow
Write-Host "1. Substitua 'Loja' por 'loja' nos imports" -ForegroundColor White
Write-Host "2. Substitua 'custoIndireto' por 'custoindireto'" -ForegroundColor White
Write-Host "3. Substitua 'itemOrcamento' por 'itemorcamento'" -ForegroundColor White
Write-Host "4. Substitua 'maquinaOrcamento' por 'maquinaorcamento'" -ForegroundColor White
Write-Host "5. Substitua 'funcaoOrcamento' por 'funcaoorcamento'" -ForegroundColor White
Write-Host "6. Substitua 'mensagemNegociacao' por 'mensagemnegociacao'" -ForegroundColor White
Write-Host "7. Substitua 'anexoMensagem' por 'anexomensagem'" -ForegroundColor White
Write-Host "8. Substitua 'tipoMaterial' por 'tipomaterial'" -ForegroundColor White

Write-Host "`nOu use o comando:" -ForegroundColor Green
Write-Host "npx prisma db push --accept-data-loss" -ForegroundColor Cyan
Write-Host "Para forçar o schema original" -ForegroundColor White


