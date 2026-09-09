# Sistema de Relatórios Diários — Software House UNIVAG

Sistema web para automação de apontamentos diários de atividades, consolidação de dados e geração de relatórios formais em PDF com upload automático no Google Drive.

---

## 📌 Sobre o Projeto

Este projeto foi desenvolvido para otimizar e padronizar o processo de prestação de contas diária da equipe de desenvolvedores e estagiários da Software House UNIVAG.

### Principais Funcionalidades
- **Interface do Membro (`index.html`):** Formulário simples e dinâmico para envio de atividades diárias e apontamento de impedimentos.
- **Painel de Consolidação (`admin.html`):** Visualização gerencial dos envios do dia, estatísticas de frentes ativas e contagem de impedimentos.
- **Geração de PDF Automática:** Formatação de relatório técnico no padrão oficial da UNIVAG usando Puppeteer.
- **Integração com Google Drive API:** Upload automatizado do relatório gerado diretamente para a pasta compartilhada da equipe no Drive.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Geração de Documentos:** Puppeteer
- **Integração Cloud:** Google Drive API (Google APIs Client Library)

---

## 📁 Estrutura de Pastas

```text
sistema-relatorios/
├── public/
│   ├── index.html          # Form de apontamento do time
│   └── admin.html          # Dashboard de consolidação do líder
├── temp/                   # Armazenamento temporário dos PDFs
├── google-credentials.json # Credenciais da Service Account do Google Cloud
├── server.js               # Servidor Express e rotas da API
├── package.json
└── README.md
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM instalado
- Chave de API de uma **Service Account** do Google Cloud (`google-credentials.json`)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/sistema-relatorios.git](https://github.com/seu-usuario/sistema-relatorios.git)
   cd sistema-relatorios
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as credenciais:**
   - Adicione o arquivo `google-credentials.json` na raiz do projeto.
   - Abra o arquivo `server.js` e insira o ID da pasta do Google Drive na variável `PASTA_DRIVE_ID`.

4. **Inicie o servidor:**
   ```bash
   npm start
   ```

5. **Acesse no navegador:**
   - **Formulário de Apontamento:** `http://localhost:3000/index.html`
   - **Painel do Líder:** `http://localhost:3000/admin.html`

---

## 📝 Licença
Documento e projeto de uso interno da **Software House UNIVAG**.