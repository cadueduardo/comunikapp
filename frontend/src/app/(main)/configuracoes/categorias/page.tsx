'use client';

import { useEffect, useState } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from 'sonner';
import { Categoria, getColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CategoryForm, formSchema } from "./category-form";

export default function CategoriasConfigPage() {
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    categoriaId: string | null;
    categoriaNome: string;
  }>({
    open: false,
    categoriaId: null,
    categoriaNome: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/categorias', { headers: { 'Authorization': `Bearer ${token}` }});
      if (response.ok) setData(await response.json());
      else toast.error("Falha ao buscar categorias.");
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro.");
    } 
    finally { setLoading(false); }
  };
  
  useEffect(() => { fetchCategorias(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/categorias/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Categoria excluída com sucesso!");
        setData(prev => prev.filter(c => c.id !== id));
      } else {
        // Tenta ler a mensagem de erro do backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Falha ao excluir categoria.";
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao conectar ao servidor.");
    }
  };

  const openDeleteDialog = (id: string, nome: string) => {
    setDeleteDialog({
      open: true,
      categoriaId: id,
      categoriaNome: nome,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      categoriaId: null,
      categoriaNome: '',
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.categoriaId) {
      await handleDelete(deleteDialog.categoriaId);
      closeDeleteDialog();
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const url = editingCategory ? `http://localhost:3001/categorias/${editingCategory.id}` : 'http://localhost:3001/categorias';
    const method = editingCategory ? 'PATCH' : 'POST';

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(`Categoria ${editingCategory ? 'atualizada' : 'criada'} com sucesso!`);
        fetchCategorias();
        setIsFormOpen(false);
        setEditingCategory(null);
      } else {
        const error = await response.json();
        toast.error(`Falha: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategory(categoria);
    setIsFormOpen(true);
  };
  
  const columns = getColumns({ onEdit: handleEdit, onDelete: (id, nome) => openDeleteDialog(id, nome) });

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
            <p className="text-gray-600">Adicione, edite ou remova as categorias do sistema.</p>
          </div>
          <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>
        
        {loading ? <p>Carregando categorias...</p> : <DataTable columns={columns} data={data} />}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingCategory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Altere o nome da categoria.' : 'Preencha o nome para a nova categoria.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            defaultValues={editingCategory || undefined}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${deleteDialog.categoriaNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </>
  );
} 