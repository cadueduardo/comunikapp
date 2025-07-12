# Teste do Motor de Cálculo de Orçamento

## Pré-requisitos

Antes de testar o motor de cálculo, é necessário:

1. **Configurar a loja** com os custos necessários:
   - `custo_maodeobra_hora`: Custo da mão de obra por hora
   - `custo_maquinaria_hora`: Custo das máquinas por hora (opcional)
   - `custos_indiretos_mensais`: Custos indiretos mensais (aluguel, contas, etc.)
   - `margem_lucro_padrao`: Margem de lucro padrão (%)
   - `impostos_padrao`: Impostos padrão (%)

2. **Cadastrar insumos** que serão utilizados no cálculo

3. **Ter token de autenticação** válido

## Endpoint

```
POST /orcamentos/calcular
Authorization: Bearer <token>
```

## Estrutura da Requisição

```json
{
  "nome_servico": "Banner 2x1m",
  "descricao": "Banner promocional 2x1m com impressão colorida",
  "horas_producao": 0.5,
  "itens": [
    {
      "insumo_id": "id_do_insumo_lona",
      "quantidade": 2
    },
    {
      "insumo_id": "id_do_insumo_tinta",
      "quantidade": 0.1
    }
  ],
  "cliente_id": "id_do_cliente_opcional",
  "margem_lucro_customizada": 100,
  "impostos_customizados": 10
}
```

## Exemplo de Resposta

```json
{
  "nome_servico": "Banner 2x1m",
  "descricao": "Banner promocional 2x1m com impressão colorida",
  "horas_producao": 0.5,
  "itens": [
    {
      "insumo_id": "id_do_insumo_lona",
      "nome_insumo": "Lona Vinílica",
      "quantidade": 2,
      "custo_unitario": 15.00,
      "custo_total": 30.00,
      "unidade_medida": "m²"
    },
    {
      "insumo_id": "id_do_insumo_tinta",
      "nome_insumo": "Tinta Eco-Solvente",
      "quantidade": 0.1,
      "custo_unitario": 80.00,
      "custo_total": 8.00,
      "unidade_medida": "litro"
    }
  ],
  "custos": {
    "custo_material": 38.00,
    "custo_mao_obra": 10.00,
    "custo_indireto": 8.24,
    "custo_total_producao": 56.24,
    "margem_lucro_percentual": 100,
    "margem_lucro_valor": 56.24,
    "subtotal_com_lucro": 112.48,
    "impostos_percentual": 10,
    "impostos_valor": 11.25,
    "preco_final": 123.73
  },
  "parametros": {
    "custo_mao_obra_por_hora": 20.00,
    "custo_maquinaria_por_hora": 0.00,
    "custos_indiretos_por_hora": 16.48,
    "margem_lucro_percentual": 100,
    "impostos_percentual": 10,
    "total_horas_produtivas_mes": 352
  }
}
```

## Lógica de Cálculo

O motor segue a lógica especificada no documento `calculo-custos-orcamento.md`:

1. **Custo Material**: Soma dos custos de todos os insumos
2. **Custo Mão de Obra**: `horas_producao × custo_mao_obra_por_hora`
3. **Custo Maquinaria**: `horas_producao × custo_maquinaria_por_hora`
4. **Custo Indireto**: `horas_producao × (custos_indiretos_mensais / 352)`
5. **Custo Total**: Material + Mão de Obra + Maquinaria + Indireto
6. **Margem de Lucro**: `custo_total × (margem_lucro_% / 100)`
7. **Impostos**: `(custo_total + margem_lucro) × (impostos_% / 100)`
8. **Preço Final**: Custo Total + Margem de Lucro + Impostos

## Erros Comuns

- **400 Bad Request**: Configurações da loja incompletas
- **400 Bad Request**: Insumo não encontrado
- **404 Not Found**: Loja não encontrada
- **401 Unauthorized**: Token inválido ou expirado 