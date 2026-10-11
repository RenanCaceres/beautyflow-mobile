<div align="center">

<a href="https://github.com/RenanCaceres/beautyflow-mobile">
  <img
    src="https://capsule-render.vercel.app/api?type=waving&height=220&section=header&text=BeautyFlow%20Mobile&fontSize=46&fontColor=ffffff&fontAlignY=38&desc=App%20Mobile%20%7C%20React%20Native%20%2B%20Expo%20%7C%20Gemini%20AI%20%7C%20WAHA%20WhatsApp&descAlignY=58&descSize=16&animation=fadeIn&color=0:6B1D3E,50:9E3560,100:D4537E"
    width="100%"
    alt="BeautyFlow Mobile Header"
  />
</a>

<img
  src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=19&duration=3000&pause=1000&color=D4537E&center=true&vCenter=true&width=800&lines=Aplicativo+Mobile+para+Gest%C3%A3o+de+Sal%C3%B5es+de+Beleza;React+Native+%E2%80%A2+Expo+Router+%E2%80%A2+Google+Gemini+AI+%E2%80%A2+WAHA;Agenda+Interativa%2C+Retorno+Inteligente+%26+Gr%C3%A1ficos+de+Caixa;Notifica%C3%A7%C3%B5es+Locais+e+Disparo+Humanizado+no+WhatsApp"
  alt="Typing SVG"
/>

<br>

<img src="https://img.shields.io/badge/React_Native-0.76-6B1D3E?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Expo_Router-SDK_52-9E3560?style=for-the-badge&logo=expo&logoColor=white" />
<img src="https://img.shields.io/badge/Google_Gemini-Gen_AI-B83B6A?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/WAHA-WhatsApp_API-D4537E?style=for-the-badge&logo=whatsapp&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Ativo-10B981?style=for-the-badge" />

<br><br>

<a href="https://github.com/RenanCaceres">
  <img src="https://img.shields.io/badge/GitHub-RenanCaceres-181717?style=for-the-badge&logo=github" />
</a>
<a href="https://www.linkedin.com/in/renan-caceres/">
  <img src="https://img.shields.io/badge/LinkedIn-Renan%20Cáceres-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
</a>
<a href="mailto:renancanselmo@gmail.com">
  <img src="https://img.shields.io/badge/Email-renancanselmo%40gmail.com-9E3560?style=for-the-badge&logo=gmail&logoColor=white" />
</a>

</div>

---

# ✿ BeautyFlow Mobile — Aplicativo React Native / Expo

Aplicativo mobile do ecossistema **BeautyFlow**, desenvolvido em **React Native + Expo Router** com interface **Clean Rose** amigável, gráficos interativos, notificações locais inteligentes e integração com **Google Gemini AI + WAHA (WhatsApp HTTP API)**.

> 🔗 **Repositório do Backend (API Node.js + PostgreSQL + Gemini + WAHA):**  
> 👉 [**github.com/RenanCaceres/beautyflow-api**](https://github.com/RenanCaceres/beautyflow-api)

---

## ✨ Funcionalidades do Aplicativo

- **📅 Agenda Inteligente (`app/(tabs)/index.jsx`)**:
  - Faixa de dias com setas laterais (`‹` / `›`) nas extremidades para recuar/avançar dias e **seta inferior (`▼`)** abaixo dos dias para abrir o calendário mensal completo (`ModalCalendario`) e ir direto ao dia selecionado.
  - **Controle de Dias de Folga / Indisponibilidade**: Botão direto na agenda e no calendário mensal para marcar ou liberar dias de folga com indicador visual nos dias bloqueados.
  - **Relógio Circular Interativo (`ModalRelogio`)**: Ao clicar no horário do agendamento, abre um relógio visual para selecionar primeiro as **horas** e em seguida os **minutos**.
  - Cadastro rápido de nova cliente direto dentro do modal de Novo Agendamento.
  - Baixa de atendimento com cálculo automático e edição do valor cobrado.

- **🔄 Retorno por Serviço Mais Vencido + Clima & Gemini + WAHA (`app/(tabs)/retorno.jsx`)**:
  - Exibe cada cliente destacando o **serviço mais vencido** dela.
  - Ao tocar na cliente, abre um modal detalhando **todos os serviços que ela já realizou**, as datas em que foram feitos e quantos dias vencidos cada procedimento possui.
  - **Autorização e Revisão de Mensagens Automáticas**: Card de alerta e modal de confirmação permitindo autorizar de imediato ou revisar/editar as mensagens geradas automaticamente pelo cron diário antes do disparo no WhatsApp.
  - Geração de mensagem única via **Google Gemini** levando em conta o **clima da cidade**, **datas comemorativas** e **momento da semana (início/meio/fim de semana)** com o nome da cliente registrado na agenda.
  - Disparo individual ou em lote pelo **WAHA** com **Range Limit Anti-Ban**.

- **💬 Marketing com IA & Seleção por Checkbox (`app/(tabs)/marketing.jsx`)**:
  - Chat com o assistente **Google Gemini** para criar mensagens promocionais com `{{nome}}`.
  - Ao clicar em **"Usar esta mensagem"**, lista todas as clientes com **checkboxes** de seleção individual/total e botão **Enviar**, disparando aos poucos no WhatsApp via **WAHA** respeitando o range limit.

- **📊 Vendas, Caixa & Gráficos de Torres (`app/(tabs)/caixa.jsx`)**:
  - **Gráfico de Torres — Clientes Atendidas por Mês**: Mostra visualmente quantas clientes/atendimentos foram realizados nos meses passados e destaca o mês selecionado.
  - **Gráfico Comparativo de Torres — Entradas × Saídas** e barra de proporção Receita vs. Despesas.
  - Alternância integrada entre **Visão Geral & Gráficos** e **Despesas / Consumo**.

- **👥 Cadastros Unificados (`app/(tabs)/clientes.jsx`)**:
  - Alternância limpa entre **Clientes** e **Serviços** com busca rápida e sugestões de ciclo de retorno (`15`, `21`, `30`, `45` dias).

- **🔔 Módulo de Notificações Locais (`src/services/notifications.js`)**:
  - **07:00 da manhã**: Resumo diário lembrando das clientes e horários marcados do dia.
  - **30 minutos antes**: Alerta antes da data/horário marcado de cada cliente.
  - **12 horas após o horário marcado**: Lembrete automático para **dar baixa** caso o atendimento ainda conste como `agendado`.
  - **Fechamento do Mês**: Notificação no último dia do mês com o resumo de quanto recebeu, quanto gastou e o lucro líquido.
  - *(Além disso, o backend envia lembretes no WhatsApp da cliente no dia do agendamento e 30 minutos antes via WAHA).*

---

## 🚀 Como Executar

### 1. Backend (`beautyflow-api`)
Certifique-se de que a API ([beautyflow-api](https://github.com/RenanCaceres/beautyflow-api)) esteja rodando:
```bash
git clone https://github.com/RenanCaceres/beautyflow-api.git
cd beautyflow-api
cp .env.example .env
npm install
npm run dev
```

### 2. Aplicativo Mobile (`beautyflow-mobile`)
```bash
git clone https://github.com/RenanCaceres/beautyflow-mobile.git
cd beautyflow-mobile
npm install
```

Configure a URL da API no arquivo `.env` (ou em `src/services/api.js`):
```env
EXPO_PUBLIC_API_URL=http://SEU_IP_OU_DOMINIO:3000/api
```

Inicie o Expo:
```bash
npx expo start
```

---

## 🗂 Estrutura de Arquivos

```
beautyflow-mobile/
├── app/
│   ├── _layout.jsx          # Inicialização e sincronização das notificações locais
│   └── (tabs)/
│       ├── _layout.jsx      # Navegação inferior Clean Rose (5 abas principais)
│       ├── index.jsx        # Agenda + Setas laterais/inferior + Calendário + Relógio Circular
│       ├── retorno.jsx      # Retorno (serviço mais vencido + modal de histórico + WAHA)
│       ├── marketing.jsx    # Chat Gemini + Lista de clientes com Checkboxes + Envio WAHA
│       ├── caixa.jsx        # Vendas/Caixa + Gráfico de Torres de Clientes por Mês + Despesas
│       ├── clientes.jsx     # Cadastros unificados (Clientes & Serviços)
│       ├── servicos.jsx     # Catálogo de procedimentos
│       └── consumo.jsx      # Controle de insumos/despesas
└── src/
    ├── services/
    │   ├── api.js           # Cliente HTTP para a beautyflow-api
    │   └── notifications.js # Agendamento de notificações locais (07h, -30m, +12h baixa, fechamento mensal)
    └── theme.js             # Paleta Clean Rose amigável e utilitários de formatação
```

---

## ⚖️ Licença & Direitos Autorais

**Copyright © 2026 Renan Cáceres — Todos os Direitos Reservados ([LICENSE](./LICENSE)).**

Este projeto possui **Licença Proprietária (`UNLICENSED`)**. A visibilidade pública deste repositório destina-se exclusivamente para fins de demonstração de portfólio profissional.

> 🚫 **É expressamente proibido** clonar, copiar, modificar, distribuir, sublicenciar ou utilizar este código-fonte (total ou parcialmente) para fins próprios, de terceiros ou comerciais sem autorização prévia e por escrito do autor. Protegido pela Lei de Direitos Autorais (Lei nº 9.610/1998) e pela Lei do Software (Lei nº 9.609/1998).

---

## 👨‍💻 Autor

<div align="center">

<a href="https://github.com/RenanCaceres">
  <img src="https://img.shields.io/badge/Renan%20Cáceres-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
</a>
<a href="https://www.linkedin.com/in/renan-caceres/">
  <img src="https://img.shields.io/badge/Renan%20Cáceres-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
</a>
<a href="mailto:renancanselmo@gmail.com">
  <img src="https://img.shields.io/badge/Contato-renancanselmo%40gmail.com-9E3560?style=for-the-badge&logo=gmail&logoColor=white" />
</a>

<br><br>

🌸 *Desenvolvido com dedicação para simplificar a gestão de beleza com tecnologia e inteligência artificial.*

<br>

<img
  src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:D4537E,50:9E3560,100:6B1D3E"
  width="100%"
  alt="BeautyFlow Mobile Footer"
/>

</div>
