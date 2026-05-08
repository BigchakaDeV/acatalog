# Acatalog Tech

Monolito com backend Django REST e frontend Next.js para e-commerce de hardware, perifericos, mobile e componentes gamer/profissionais.

## Estrutura

- `backend/`: Django, DRF, SimpleJWT, django-filter, DRF Spectacular.
- `frontend/`: Next.js App Router, React, TypeScript, Tailwind CSS e React Query.
- Banco local inicial: SQLite.
- PostgreSQL: pronto via `DATABASE_URL`.

## Backend

```powershell
cd "C:\Users\cezar\Desktop\loja informatica"
Copy-Item backend\.env.example backend\.env
backend\venv\Scripts\pip.exe install -r backend\requirements.txt
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py seed_demo
backend\venv\Scripts\python.exe backend\manage.py runserver
```

API: `http://127.0.0.1:8000/api/`
Docs: `http://127.0.0.1:8000/api/docs/`

Variaveis principais em `backend/.env`:

```env
DJANGO_SECRET_KEY=troque-esta-chave-em-producao
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
SQLITE_NAME=db.sqlite3
DATABASE_URL=postgresql://usuario:senha@localhost:5432/acatalog
GOOGLE_CLIENT_ID=
REFRESH_COOKIE_SECURE=False
REFRESH_COOKIE_SAMESITE=Lax
```

Dados demo criados por `seed_demo`:

- Admin: `admin@acatalog.local` / `Admin@12345`
- Cliente: `cliente@acatalog.local` / `Cliente@12345`
- Cupom: `RAD10`

Para outro login administrativo pelo dashboard, o usuario precisa ser `is_staff=True` ou ter `role=admin/operator`.

## Frontend

```powershell
cd "C:\Users\cezar\Desktop\loja informatica\frontend"
npm.cmd install
npm.cmd run dev -- -p 3001
```

Loja: `http://localhost:3001/`
Dashboard: `http://localhost:3001/admin`

Se usar outra API:

```powershell
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000/api"
npm.cmd run dev -- -p 3001
```

## Fluxo manual

1. Criar conta em `/login`.
2. Navegar em `/catalogo`.
3. Abrir produto, adicionar ao carrinho e salvar na wishlist.
4. Ver `/carrinho`, aplicar cupom criado no admin e conferir totais vindos da API.
5. Criar endereco em `/checkout`, selecionar pagamento mock e criar pedido.
6. Ver pedido em `/conta`.
7. Entrar em `/admin/login`, cadastrar produtos/categorias/cupons e acompanhar pedidos.

## Validacao

```powershell
backend\venv\Scripts\python.exe backend\manage.py check
backend\venv\Scripts\python.exe backend\manage.py test
cd frontend
npm.cmd run lint
npm.cmd run build
```

## Observacoes

- O frontend agora exibe erro claro quando a API falha; mocks ficam isolados em `frontend/src/lib/mock-data.ts` para desenvolvimento visual, sem fallback silencioso na camada de API.
- Login Google exige `GOOGLE_CLIENT_ID` configurado e valida o token pelo Google Identity Services.
- Pagamentos externos e frete real continuam previstos; o MVP usa pagamento mock e frete simplificado.
