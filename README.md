# ✿ BeautyFlow — Monorepo Completo

Três projetos independentes que se comunicam pela mesma API REST.

```
beautyflow-api/      ← Node.js + SQL Server (porta 3000)
beautyflow-web/      ← React + Vite         (porta 5173)
beautyflow-mobile/   ← React Native + Expo  (app celular)
```

---

## 🚀 Como rodar

### 1. API (sempre primeiro)

```bash
cd beautyflow-api
cp .env.example .env      # edite com suas credenciais SQL Server
npm install
npm run dev               # http://localhost:3000
```

Teste: `http://localhost:3000/api/health` deve retornar `{"ok":true}`

---

### 2. Site React

```bash
cd beautyflow-web
npm install
npm run dev               # http://localhost:5173
```

O Vite já redireciona `/api/*` para `localhost:3000` automaticamente.

Para acessar de **outras máquinas na rede**:
```bash
npm run dev -- --host
# Acesse: http://SEU_IP:5173
```

---

### 3. App Mobile

```bash
cd beautyflow-mobile
npm install
```

Edite `src/services/api.js` e troque o `BASE_URL` pelo IP da sua máquina:
```js
const BASE_URL = 'http://192.168.1.105:3000/api'; // IP do seu computador
```

```bash
npx expo start
```

Leia o QR Code com o app **Expo Go** no celular (Android ou iOS).
O celular precisa estar na mesma rede Wi-Fi que o computador.

---

## 🌐 Acesso externo (app fora da rede)

### Opção 1 — Ngrok (mais fácil, grátis)

```bash
# Instale: https://ngrok.com/download
ngrok http 3000
# Vai gerar algo como: https://abc123.ngrok.io
```

Troque o `BASE_URL` no mobile:
```js
const BASE_URL = 'https://abc123.ngrok.io/api';
```

Adicione a URL do Ngrok no `.env` da API:
```
CORS_ORIGINS=http://localhost:5173,https://abc123.ngrok.io
```

### Opção 2 — Deploy (Railway)

1. Suba a `beautyflow-api` no Railway.app
2. Configure as variáveis de ambiente com as credenciais do banco
3. Troque o `BASE_URL` no mobile pela URL do deploy

---

## 📡 Endpoints da API

| Método | Rota                            | Descrição               |
|--------|----------------------------------|-------------------------|
| GET    | `/api/health`                   | Status da API           |
| GET    | `/api/clientes`                 | Listar clientes         |
| GET    | `/api/clientes/search?q=nome`   | Autocomplete            |
| POST   | `/api/clientes`                 | Criar cliente           |
| PUT    | `/api/clientes/:id`             | Atualizar cliente       |
| DELETE | `/api/clientes/:id`             | Remover cliente         |
| GET    | `/api/servicos`                 | Listar serviços         |
| POST   | `/api/servicos`                 | Criar serviço           |
| PUT    | `/api/servicos/:id`             | Atualizar serviço       |
| DELETE | `/api/servicos/:id`             | Remover serviço         |
| GET    | `/api/agendamentos?data=...`    | Agendamentos do dia     |
| POST   | `/api/agendamentos`             | Criar agendamento       |
| PATCH  | `/api/agendamentos/:id/baixa`   | Dar baixa               |
| DELETE | `/api/agendamentos/:id`         | Remover agendamento     |
| GET    | `/api/consumo?mes=3&ano=2025`   | Listar consumo          |
| POST   | `/api/consumo`                  | Registrar consumo       |
| DELETE | `/api/consumo/:id`              | Remover consumo         |
| GET    | `/api/caixa?periodo=mes&...`    | Relatório de caixa      |
| GET    | `/api/retorno?filtro=vencidas`  | Filtro de retorno       |

---

## 🗂 Estrutura de arquivos

```
beautyflow-api/
├── src/
│   ├── app.js
│   ├── database.js
│   ├── models/   (Clientes, Servicos, Agendamentos, Consumo, Caixa, Retorno)
│   └── routes/   (uma por módulo)
└── .env.example

beautyflow-web/
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── services/api.js
│   ├── components/ (Layout, shared)
│   └── pages/ (Agenda, Clientes, Servicos, Consumo, Caixa, Retorno)
└── vite.config.js

beautyflow-mobile/
├── app/
│   ├── _layout.jsx
│   └── (tabs)/
│       ├── _layout.jsx
│       ├── index.jsx     (Agenda)
│       ├── clientes.jsx
│       ├── servicos.jsx
│       ├── consumo.jsx
│       ├── caixa.jsx
│       └── retorno.jsx
└── src/
    ├── services/api.js
    └── theme.js
```
