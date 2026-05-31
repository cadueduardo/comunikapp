'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { estoqueApi } from '@/lib/api-client'
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
  const [dialogAproveitar, setDialogAproveitar] = useState(false)
  const [dialogDescartar, setDialogDescartar] = useState(false)
  const [quantidadeAproveitada, setQuantidadeAproveitada] = useState('')
  const [economiaGerada, setEconomiaGerada] = useState('')
  const [motivoDescarte, setMotivoDescarte] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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
      <div>
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
      <div>
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

  const podeAproveitar =
    sobra &&
    ['DISPONIVEL', 'PARCIALMENTE_APROVEITADA'].includes(sobra.status)
  const podeDescartar = sobra && sobra.status !== 'APROVEITADA' && sobra.status !== 'DESCARTADA'

  const handleAproveitar = async () => {
    const token = localStorage.getItem('access_token')
    if (!token || !sobra) return
    const quantidade = Number(quantidadeAproveitada.replace(',', '.'))
    const economia = Number(economiaGerada.replace(',', '.'))
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      toast.error('Informe a quantidade ou área aproveitada')
      return
    }
    setActionLoading(true)
    try {
      await estoqueApi.aproveitarSobra(
        sobra.id,
        {
          quantidadeAproveitada: quantidade,
          economiaGerada: Number.isFinite(economia) ? economia : 0,
        },
        token,
      )
      toast.success('Aproveitamento registrado')
      setDialogAproveitar(false)
      await carregar()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao aproveitar sobra')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDescartar = async () => {
    const token = localStorage.getItem('access_token')
    if (!token || !sobra) return
    if (!motivoDescarte.trim()) {
      toast.error('Informe o motivo do descarte')
      return
    }
    setActionLoading(true)
    try {
      await estoqueApi.descartarSobra(sobra.id, { motivo: motivoDescarte.trim() }, token)
      toast.success('Sobra descartada')
      setDialogDescartar(false)
      await carregar()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao descartar sobra')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
        <div className="flex flex-wrap gap-2">
          {podeAproveitar && (
            <Button
              onClick={() => {
                setQuantidadeAproveitada(String(sobra.quantidade ?? ''))
                setEconomiaGerada('')
                setDialogAproveitar(true)
              }}
            >
              Aproveitar
            </Button>
          )}
          {podeDescartar && (
            <Button
              variant="destructive"
              onClick={() => {
                setMotivoDescarte('')
                setDialogDescartar(true)
              }}
            >
              Descartar
            </Button>
          )}
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

      <Dialog open={dialogAproveitar} onOpenChange={setDialogAproveitar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aproveitar retalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Quantidade / área aproveitada</label>
              <Input
                value={quantidadeAproveitada}
                onChange={(e) => setQuantidadeAproveitada(e.target.value)}
                placeholder="Ex: 1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Economia gerada (R$)</label>
              <Input
                value={economiaGerada}
                onChange={(e) => setEconomiaGerada(e.target.value)}
                placeholder="Ex: 120,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAproveitar(false)}>
              Cancelar
            </Button>
            <Button disabled={actionLoading} onClick={() => void handleAproveitar()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogDescartar} onOpenChange={setDialogDescartar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar sobra</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivo do descarte (obrigatório)"
            value={motivoDescarte}
            onChange={(e) => setMotivoDescarte(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDescartar(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => void handleDescartar()}
            >
              Confirmar descarte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


