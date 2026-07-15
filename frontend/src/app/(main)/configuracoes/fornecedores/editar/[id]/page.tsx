import { redirect } from 'next/navigation';

export default async function EditarFornecedorLegadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/fornecedores/editar/${id}`);
}
