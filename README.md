# Recibo Fácil

Sistema para gestão de empréstimos particulares com controle de parcelas, pagamentos e recibos digitais com assinatura eletrônica e hash de integridade.

## Problema

Empréstimos informais entre pessoas físicas carecem de registros confiáveis. O Recibo Fácil resolve isso com:

- Rastreamento de parcelas e vencimentos
- Fluxo de pagamento em duas etapas (devedor paga, credor confirma)
- Recibos digitais com hash SHA-256 e assinatura eletrônica por senha
- Trilha de auditoria de todas as operações
- Dashboard com visão consolidada para credor e devedor

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite, React Router 7, Lucide React |
| Backend | Python 3.12, Django 5, Django REST Framework, SimpleJWT |
| Banco | PostgreSQL 16 |
| Infra | Docker Compose |
| Autenticação | JWT (Bearer + query param) |

## Funcionalidades

- Cadastro/login por email + senha
- Criação de empréstimos com valor, juros, número de parcelas
- Acompanhamento de parcelas pendentes, pagas e vencidas
- Pagamento em duas etapas: devedor registra o pagamento (com senha), credor confirma (com senha)
- Recibos digitais gerados automaticamente após confirmação
- Hash SHA-256 de integridade no recibo
- Visualização do recibo em HTML (pronto para impressão)
- Dashboard com indicadores para credor e devedor
- Design responsivo (desktop e mobile)
- Trilha de auditoria completa

## Modelo de dados

```
User (email, name, phone)
  │
  ├── Loan (creditor, debtor, amount, interest, installments, status)
  │     │
  │     └── Installment (number, due_date, amount, status)
  │           │
  │           └── Payment (amount, method, date, confirmed, confirmed_at, recorded_by)
  │                 │
  │                 └── Receipt (number UUID, document_hash SHA-256, status)
  │                       │
  │                       └── Signature (user, signed_at)
  │
  ├── Notification (title, message, read_at)
  └── AuditLog (action, entity, entity_id, ip, user_agent)
```

## Como executar

```bash
git clone <repo-url>
cd recibofacil

# Criar arquivo de ambiente (opcional)
cp .env.example .env

# Iniciar tudo
docker compose up --build
```

Acessar:

- **Aplicação**: http://localhost:8000 (servida pelo Django, SPA)
- **Admin Django**: http://localhost:8000/admin/
- **API**: http://localhost:8000/api/
- **Frontend em dev**: http://localhost:5173 (hot reload, Vite)

### Primeiro acesso

Sem superusuario, acesse http://localhost:8000 e clique em **Cadastre-se** para criar uma conta.

Para admin:

```bash
docker compose exec api python manage.py createsuperuser
```

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
| POST | `/api/loans/{id}/confirm_payment/{payment_id}/` | JWT | Credor confirma pagamento (com senha) |
| GET | `/api/payments/` | JWT | Listar pagamentos |
| GET | `/api/receipts/` | JWT | Listar recibos |
| POST | `/api/receipts/{id}/sign/` | JWT | Assinar recibo (com senha) |
| GET | `/api/receipts/{id}/document/` | JWT | Visualizar recibo HTML |
| POST | `/api/receipts/{id}/cancel/` | JWT | Cancelar recibo |

### Autenticação

O token JWT é enviado via:

- Header: `Authorization: Bearer <token>`
- Query param: `?token=<token>` (usado em links compartilháveis como o documento do recibo)

## Estrutura do projeto

```
recibofacil/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   └── core/
│       ├── models/          (loan, payment, receipt, user, audit, notification)
│       ├── views/           (loans, payments, receipts, dashboard, auth, spa)
│       ├── serializers/
│       ├── services/        (receipt HTML, audit log)
│       ├── authentication.py
│       └── migrations/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── style.css
        ├── api/             (client, auth, loans, receipts)
        ├── components/      (Auth, Layout, Dashboard, ErrorBoundary)
        ├── pages/           (Dashboard, Loans, LoanDetail, NewLoan, Receipts)
        └── hooks/           (useAuth)
```

## Fluxo de pagamento

1. **Devedor** acessa o empréstimo, clica em "Pagar", informa valor, data, método e **sua senha**
2. Sistema registra o pagamento como **não confirmado** e cria um rascunho de recibo
3. **Credor** acessa o mesmo empréstimo, vê o pagamento pendente de confirmação, clica em "Confirmar" e informa **sua senha**
4. Sistema confirma o pagamento, gera as assinaturas digitais e finaliza o recibo com hash SHA-256
5. Ambas as partes podem visualizar o recibo com hash de integridade

## Arquitetura

### Decisões técnicas

- **Settings em arquivo único**: Para MVP, sem split `base/production`. Segredos via variáveis de ambiente.
- **JWT stateless**: Sem sessões no servidor. Token via header ou query param.
- **Recibos em HTML**: Sem geração/armazenamento de PDF. O HTML inclui hash SHA-256 e botão de impressão.
- **Assinatura por senha**: Usuário confirma ações informando a própria senha. Sem upload de imagem de assinatura.
- **Hash de integridade**: SHA-256 calculado sobre os dados do recibo (número, valor, data, partes).
- **Package-by-domain**: Models, views e serializers organizados por domínio (não arquivos monolíticos).

### Segurança

- Senhas nunca são armazenadas em texto plano (Django PBKDF2)
- JWT com expiração (access: 5 min, refresh: 24 h)
- Todas as rotas (exceto registro/login) exigem autenticação
- Operações sensíveis (pagar, confirmar, assinar) exigem senha do usuário
- Pagamento só é finalizado após confirmação do credor

## Produção

Para ambiente de produção:

```bash
# Ajustar .env
DJANGO_SECRET_KEY=<chave-aleatoria-forte>
DEBUG=0
DATABASE_URL=postgres://user:pass@host:5432/recibofacil

# Construir frontend e copiar para o backend
cd frontend && npm install && npm run build
cp -r dist ../backend/frontend_dist

# Iniciar sem Vite (apenas API serve o frontend)
docker compose up -d db api
```

O backend serve tanto a API (`/api/`) quanto os assets estáticos e o SPA (`/`), eliminando a necessidade de um servidor web separado em deployments simples.
