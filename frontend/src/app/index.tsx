// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona automaticamente a rota raiz ('/') para a tela de sensores
  return <Redirect href="/sensores" />;
}