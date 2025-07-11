'use client';

import { useEffect, useState } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from 'sonner';
import { Fornecedor, getColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FornecedorForm, formSchema } from "./fornecedor-form";

export default function FornecedoresConfigPage() {
  const [data, setData] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/fornecedores', { headers: { 'Authorization': `Bearer ${token}` }});
      if (response.ok) setData(await response.json());
      else toast.error("Falha ao buscar fornecedores.");
    } catch (err) { toast.error("Ocorreu um erro ao buscar fornecedores."); console.error(err) } 
    finally { setLoading(false); }
  };
  
  useEffect(() => { fetchFornecedores(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/fornecedores/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Fornecedor excluído com sucesso!");
        setData(prev => prev.filter(f => f.id !== deleteId));
      } else {
        toast.error("Falha ao excluir fornecedor.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao excluir o fornecedor.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const url = editingFornecedor ? `http://localhost:3001/fornecedores/${editingFornecedor.id}` : 'http://localhost:3001/fornecedores';
    const method = editingFornecedor ? 'PATCH' : 'POST';

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(`Fornecedor ${editingFornecedor ? 'atualizado' : 'criado'} com sucesso!`);
        fetchFornecedores();
        setIsFormOpen(false);
        setEditingFornecedor(null);
      } else {
        const errorData = await response.json();
        toast.error(`Falha: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao salvar o fornecedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setIsFormOpen(true);
  };
  
  const columns = getColumns({ onEdit: handleEdit, onDelete: (id) => setDeleteId(id) });

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Fornecedores</h1>
            <p className="text-gray-600">Adicione, edite ou remova os fornecedores do sistema.</p>
          </div>
          <Button onClick={() => { setEditingFornecedor(null); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        </div>
        
        {loading ? <p>Carregando fornecedores...</p> : <DataTable columns={columns} data={data} />}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingFornecedor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFornecedor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
            <DialogDescription>
              {editingFornecedor ? 'Altere o nome do fornecedor.' : 'Preencha o nome para o novo fornecedor.'}
            </DialogDescription>
          </DialogHeader>
          <FornecedorForm 
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            defaultValues={editingFornecedor || undefined}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 