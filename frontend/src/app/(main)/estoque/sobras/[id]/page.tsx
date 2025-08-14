'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'

interface SobraDetalhe {
  id: string
  codigoSobra: string
  descricao: string
  dimensoes?: string | null
  area?: number | null
  quantidade: number
  unidadeMedida: string
  material: string
  cor?: string | null
  acabamento?: string | null
  status: string
  origem?: string | null
  dataGeracao: string
  itemCodigo?: string
  itemNome?: string
  localizacaoCodigo?: string
  economiaGerada?: number
}

export default function VerSobraPage() {
  const params = useParams()
  const sobraId = String(params?.id || '')
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [sobra, setSobra] = useState<SobraDetalhe | null>(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await apiRequest(`/api/estoque/sobras/${sobraId}`)
      if (!res.ok) throw new Error('Falha ao carregar sobra')
      const data = await res.json()
      const raw = data?.data || data
      const normalized: SobraDetalhe = {
        id: raw.id,
        codigoSobra: raw.codigoSobra ?? raw.codigo_sobra ?? '',
        descricao: raw.descricao ?? '',
        dimensoes: raw.dimensoes ?? null,
        area: raw.area != null ? Number(raw.area) : null,
        quantidade: Number(raw.quantidade ?? 0),
        unidadeMedida: raw.unidadeMedida ?? raw.unidade_medida ?? '',
        material: raw.material ?? '',
        cor: raw.cor ?? null,
        acabamento: raw.acabamento ?? null,
        status: raw.status ?? 'DISPONIVEL',
        origem: raw.origem ?? null,
        dataGeracao: raw.dataGeracao ?? raw.data_geracao ?? raw.created_at ?? new Date().toISOString(),
        itemCodigo: raw.item_codigo,
        itemNome: raw.item_nome,
        localizacaoCodigo: raw.localizacao_codigo,
        economiaGerada: raw.economiaGerada ?? raw.economia_gerada,
      }
      setSobra(normalized)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar sobra')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sobraId && !userLoading && user) carregar()
  }, [sobraId, userLoading, user])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!sobra) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/estoque/sobras">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">Sobra não encontrada.</CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '-')
  const money = (n?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/estoque/sobras">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" /> Sobra {sobra.codigoSobra}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/estoque/sobras/${sobra.id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Sobra</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Descrição</div>
            <div className="text-sm">{sobra.descricao}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Material</div>
            <div className="text-sm">{sobra.material}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Dimensões</div>
            <div className="text-sm">{sobra.dimensoes || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Área</div>
            <div className="text-sm">{sobra.area ?? '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Quantidade</div>
            <div className="text-sm">{sobra.quantidade} {sobra.unidadeMedida}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <Badge>{sobra.status}</Badge>
          </div>
          <div>
            <div className="text-sm text-gray-500">Gerado em</div>
            <div className="text-sm">{formatDate(sobra.dataGeracao)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Economia Gerada</div>
            <div className="text-sm">{money(sobra.economiaGerada)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Localização</div>
            <div className="text-sm">{sobra.localizacaoCodigo || '-'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


