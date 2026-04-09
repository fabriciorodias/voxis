import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace para silenciar o warning de "multiple lockfiles":
  // o Next detecta um package-lock.json em $HOME e tenta inferir o workspace.
  turbopack: {
    root: path.join(__dirname),
  },
}

export default nextConfig
