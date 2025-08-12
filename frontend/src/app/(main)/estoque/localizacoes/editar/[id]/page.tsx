import LocalizacaoForm from '../../localizacao-form';

interface EditarLocalizacaoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarLocalizacaoPage({ params }: EditarLocalizacaoPageProps) {
  const { id } = await params;
  return <LocalizacaoForm localizacaoId={id} />;
} 