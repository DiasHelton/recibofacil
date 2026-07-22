# Recibo Fácil

Sistema para gestão de empréstimos particulares com controle de parcelas,
pagamentos e recibos digitais com assinatura eletrônica e hash de integridade.

- **Produção:** https://recibofacil.onrender.com
- **Repositório:** https://github.com/DiasHelton/recibofacil

---

## Stack

| Camada     | Tecnologia                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, React Router 7, Lucide     |
| Backend    | Python 3.12, Django 5, DRF, SimpleJWT, Gunicorn        |
| Banco      | PostgreSQL 16 (Neon.tech — grátis, sem expiração)       |
| Infra      | Docker Compose (dev), Render (prod)                     |
| Autenticação | JWT (Bearer + query param)                           |

---

## Desenvolvimento local

### Pré-requisitos

- Docker e Docker Compose
- Node.js 22+ (para build do frontend)

### Executar

```bash
git clone https://github.com/DiasHelton/recibofacil.git
cd recibofacil

# Iniciar tudo
docker compose up --build
```

Acessar:

| URL                               | O quê                     |
| --------------------------------- | ------------------------- |
| http://localhost:5173             | Frontend (Vite, hot reload) |
| http://localhost:8000             | Frontend + API (Django SPA) |
| http://localhost:8000/api/        | API REST                  |
| http://localhost:8000/admin/      | Admin Django              |

### Primeiro uso

Acesse http://localhost:8000 e clique em **Cadastre-se** para criar o primeiro
usuário. Ou via API:

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H 'Content-Type: application/json' \
  -d '{"name":"Seu Nome","email":"seu@email.com","password":"suasenha"}'
```

### Comandos úteis

```bash
# Acessar o shell do Django
docker compose exec api python manage.py shell

# Criar superusuário (admin)
docker compose exec api python manage.py createsuperuser

# Ver logs
docker compose logs -f api

# Resetar banco local
docker compose down -v && docker compose up --build
```

---

## Produção (Render + Neon)

### Arquitetura

```
Usuário ──► https://recibofacil.onrender.com
                  │
          ┌───────┴───────┐
          │   Render      │
          │  (Docker)     │
          │               │
          │  Gunicorn     │
          │  Django SPA   │
          │  Whitenoise   │
          └───────┬───────┘
                  │
          ┌───────┴───────┐
          │  Neon.tech    │
          │  PostgreSQL16 │
          └───────────────┘
```

### Serviços gratuitos utilizados

| Serviço  | Plano | Limites                          |
| -------- | ----- | -------------------------------- |
| Render   | Free  | 512 MB RAM, dormência após 15 min |
| Neon     | Free  | 500 MB, branch, SQL Editor       |
| GitHub   | Free  | Repositório público              |

> O Render "dorme" após 15 min sem uso. O primeiro acesso após período
> ocioso leva ~30 segundos para reativar.

### Como foi feito o deploy

1. Repositório GitHub conectado ao Render
2. Build via `Dockerfile` multi-stage (compila frontend + backend)
3. Banco PostgreSQL na Neon, conectado via `DATABASE_URL`
4. Migrations rodam automaticamente na inicialização
5. Gunicorn serve a aplicação na porta `$PORT` (definida pelo Render)

### Variáveis de ambiente (Render)

| Variável         | Valor                                            |
| ---------------- | ------------------------------------------------ |
| `DATABASE_URL`   | `postgresql://...` (fornecido pela Neon)         |
| `DJANGO_SECRET_KEY` | `chamanabota`                                |
| `ALLOWED_HOSTS`  | `.onrender.com`                                  |
| `DEBUG`          | `0`                                              |

---

## Manutenção

### Backup do banco

A Neon mantém backups automáticos por 7 dias. Para exportar manualmente:

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Selecione o projeto → **Branch** → `main`
3. Clique em **Generate credentials** e copie a string
4. Rode localmente:

```bash
pg_dump --no-owner --no-acl "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

### Resetar o banco

**Cuidado:** isso apaga todos os dados.

1. Acesse o **SQL Editor** da Neon
2. Execute:

```sql
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
```

3. No Render, clique em **Manual Deploy → Deploy latest commit**
   (as migrations rodarão e recriarão as tabelas vazias)

### Atualizar o sistema

```bash
# Local: puxar alterações e rebuildar
git pull
docker compose up --build

# Produção: push para o GitHub faz deploy automático no Render
git add .
git commit -m "descrição das alterações"
git push origin main
```

### Acessar o banco remoto via terminal

```bash
# Instalar psql (macOS)
brew install libpq

# Conectar
psql "$DATABASE_URL"
```

### Rodar comandos Django no banco remoto

Usando o Docker local com a DATABASE_URL da Neon:

```bash
docker run --rm -e DATABASE_URL="$DATABASE_URL" \
  -e DJANGO_SECRET_KEY=chamanabota \
  recibofacil-test \
  python manage.py shell
```

Ou crie um alias no `~/.zshrc`:

```bash
alias recibofacil-shell='docker run --rm -it \
  -e DATABASE_URL="postgresql://..." \
  -e DJANGO_SECRET_KEY=chamanabota \
  recibofacil-test \
  python manage.py shell'
```

---

## API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register/` | — | Criar conta |
| POST | `/api/auth/token/` | — | Login (obter JWT) |
| POST | `/api/auth/refresh/` | — | Renovar JWT |
| GET | `/api/auth/me/` | JWT | Dados do usuário logado |
| GET | `/api/dashboard/` | JWT | Dashboard consolidado |
| GET/POST | `/api/loans/` | JWT | Listar/criar empréstimos |
| GET/PUT/PATCH/DELETE | `/api/loans/{id}/` | JWT | Detalhe do empréstimo |
| POST | `/api/loans/{id}/pay/` | JWT | Devedor paga parcela (com senha) |
| POST | `/api/loans/{id}/confirm_payment/{payment_id}/` | JWT | Credor confirma (com senha) |
| GET | `/api/payments/` | JWT | Listar pagamentos |
| GET | `/api/receipts/` | JWT | Listar recibos |
| POST | `/api/receipts/{id}/sign/` | JWT | Assinar recibo (com senha) |
| GET | `/api/receipts/{id}/document/` | JWT | Visualizar recibo HTML |
| POST | `/api/receipts/{id}/cancel/` | JWT | Cancelar recibo |

Autenticação via header `Authorization: Bearer <token>` ou query param
`?token=<token>` (usado em links de recibos).

---

## Fluxo de pagamento

1. **Devedor** acessa o empréstimo → clica em "Pagar" → informa valor, data,
   método e **sua senha**
2. Sistema registra o pagamento como **não confirmado** e cria rascunho de
   recibo
3. **Credor** acessa o mesmo empréstimo → vê o pagamento pendente → clica em
   "Confirmar" → informa **sua senha**
4. Sistema confirma o pagamento, gera as assinaturas digitais e finaliza o
   recibo com hash SHA-256
5. Ambas as partes podem visualizar o recibo (hash de integridade incluso)

---

## Estrutura do projeto

```
recibofacil/
├── Dockerfile           # Multi-stage (frontend + backend)
├── docker-compose.yml   # Dev local (PostgreSQL + API + Vite)
├── render.yaml          # Config do Render (deploy automático)
├── fly.toml             # (opcional) Config Fly.io
├── .env.example         # Variáveis de ambiente de referência
├── backend/
│   ├── config/
│   │   ├── settings.py  # Django settings (single file)
│   │   └── urls.py      # URL conf (api/ + SPA catch-all)
│   └── core/
│       ├── models/      # user, loan, payment, receipt, audit...
│       ├── views/       # loans, payments, receipts, dashboard, auth
│       ├── serializers/ # DRF serializers
│       ├── services/    # receipt HTML, audit log
│       ├── authentication.py
│       ├── management/  # Custom commands (ensure_default_user)
│       └── migrations/
└── frontend/
    ├── vite.config.ts   # Proxy /api para backend no dev
    ├── src/
    │   ├── api/         # client.ts, auth.ts, loans.ts...
    │   ├── components/  # Sidebar, LoginForm, Cards...
    │   └── pages/       # Dashboard, Loans, Receipts...
    └── package.json
```

---

## Arquitetura e decisões técnicas

- **Settings single file** — sem split ambiente; segredos via env vars
- **JWT stateless** — sem sessões no servidor
- **Recibos em HTML** — sem geração de PDF; inclui hash SHA-256 e
  impressão via CSS `@media print`
- **Assinatura por senha** — usuário confirma ações com a própria senha
  (sem upload de imagem)
- **Package-by-domain** — models, views e serializers separados por domínio
- **QueryParamTokenAuthentication** — aceita JWT via `?token=` para
  links compartilháveis de recibos
- **Whitenoise** — serve arquivos estáticos do Django admin em produção
- **Vite proxy** — no dev, `/api` é redirecionado para o Django

### Segurança

- Senhas com PBKDF2 (Django padrão)
- JWT expira em 5 min (access) / 24 h (refresh)
- Todas as rotas exigem JWT (exceto registro e login)
- Pagar, confirmar e assinar exigem senha do usuário logado
- Pagamento só é finalizado após credor confirmar

---

## Solução de problemas

| Problema | Causa | Solução |
|----------|-------|---------|
| Render retorna 502 | Banco inacessível | Verificar `DATABASE_URL` no Render |
| Login retorna "usuário não encontrado" | Banco vazio | Fazer cadastro |
| App lento no primeiro acesso | Render "dormiu" | Aguardar ~30s, recarregar |
| `docker compose` falha | Porta ocupada | `kill $(lsof -ti:8000)` |
| Migrations pendentes | Código novo | `docker compose exec api python manage.py migrate` |
