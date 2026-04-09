// A rota raiz é tratada pelo proxy (src/proxy.ts), que redireciona o usuário
// autenticado para o dashboard do seu perfil ou para /login caso contrário.
// Este componente só renderiza em último caso, se por algum motivo o proxy
// não interceptar a requisição.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
