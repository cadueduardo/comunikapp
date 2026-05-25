'use client';

import { useEffect, useState } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from 'sonner';
import { Fornecedor, getColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FornecedorForm, formSchema } from "./fornecedor-form";
import { fornecedoresApi } from "@/lib/api-client";

export default function FornecedoresConfigPage() {
  const [data, setData] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    fornecedorId: string | null;
    fornecedorNome: string;
  }>({
    open: false,
    fornecedorId: null,
    fornecedorNome: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const fornecedores = await fornecedoresApi.getAll(token);
        setData(fornecedores as Fornecedor[]);
      }
    } catch (err) { 
      toast.error("Ocorreu um erro ao buscar fornecedores."); 
      console.error(err) 
    } 
    finally { setLoading(false); }
  };
  
  useEffect(() => { fetchFornecedores(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fornecedoresApi.delete(id, token);
        toast.success("Fornecedor excluído com sucesso!");
        setData(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao excluir o fornecedor.");
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      fornecedorId: id,
      fornecedorNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      fornecedorId: null,
      fornecedorNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.fornecedorId) {
      await handleDelete(deleteDialog.fornecedorId);
      closeDeleteDialog();
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        if (editingFornecedor) {
          await fornecedoresApi.update(editingFornecedor.id, values, token);
          toast.success("Fornecedor atualizado com sucesso!");
        } else {
          await fornecedoresApi.create(values, token);
          toast.success("Fornecedor criado com sucesso!");
        }
        fetchFornecedores();
        setIsFormOpen(false);
        setEditingFornecedor(null);
      }
    } catch (err: unknown) {
      console.error(err);
      
      // Tratar erro de duplicidade
      if (err instanceof Error && err.message.includes('Já existe um fornecedor')) {
        toast.error(err.message);
      } else if (err instanceof Error && err.message.includes('HTTP error! status: 500')) {
        toast.error("Erro interno do servidor. Tente novamente.");
      } else {
        toast.error("Ocorreu um erro ao salvar o fornecedor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setIsFormOpen(true);
  };
  
  const columns = getColumns({ onEdit: handleEdit, onDelete: (id, nome) => openDeleteDialog(id, nome) });

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
            fornecedorId={editingFornecedor?.id}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${deleteDialog.fornecedorNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </>
  );
} 