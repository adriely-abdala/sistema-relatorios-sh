const express = require('express');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve index.html e admin.html

// Banco de dados em memória (substituir por MariaDB/PostgreSQL em produção)
let bancoApontamentos = [];

// ==========================================
// CONFIGURAÇÃO GOOGLE DRIVE API
// ==========================================
// Salve o arquivo de chave da Service Account do Google Cloud como 'google-credentials.json'
const KEY_FILE_PATH = path.join(__dirname, 'google-credentials.json');
const PASTA_DRIVE_ID = 'SEU_ID_DA_PASTA_NO_GOOGLE_DRIVE'; // ID da pasta de relatórios

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

// ==========================================
// ROTAS DA API
// ==========================================

// 1. Receber novo apontamento diário (index.html)
app.post('/api/apontamentos', (req, res) => {
    const { membro, projeto, atividades, dificuldades, data } = req.body;

    if (!membro || !projeto || !atividades) {
        return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const novoApontamento = {
        id: Date.now(),
        membro,
        projeto,
        atividades,
        dificuldades: dificuldades || '',
        data: data || new Date().toISOString().split('T')[0]
    };

    bancoApontamentos.push(novoApontamento);
    console.log(`[LOG] Apontamento registrado: ${membro} (${novoApontamento.data})`);
    return res.status(201).json({ sucesso: true, apontamento: novoApontamento });
});

// 2. Listar apontamentos filtrados por data (admin.html)
app.get('/api/apontamentos', (req, res) => {
    const dataFiltro = req.query.data || new Date().toISOString().split('T')[0];
    const filtrados = bancoApontamentos.filter(item => item.data === dataFiltro);
    return res.json(filtrados);
});

// 3. Gerar PDF e Enviar para o Google Drive (admin.html)
app.post('/api/relatorio/gerar-e-enviar', async (req, res) => {
    try {
        const { data, relatos } = req.body;

        if (!relatos || relatos.length === 0) {
            return res.status(400).json({ erro: 'Nenhum relato fornecido para geração do PDF.' });
        }

        // Formatação de data (AAAA-MM-DD -> DD/MM/AAAA)
        const partesData = data.split('-');
        const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

        // A. Montagem do HTML do Relatório
        const htmlContent = gerarHtmlRelatorio(dataFormatada, relatos);

        // B. Gerar PDF via Puppeteer
        const nomeArquivo = `Relatorio_${data}.pdf`;
        const caminhoPdfTemp = path.join(__dirname, 'temp', nomeArquivo);

        if (!fs.existsSync(path.join(__dirname, 'temp'))) {
            fs.mkdirSync(path.join(__dirname, 'temp'));
        }

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: caminhoPdfTemp,
            format: 'A4',
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
            printBackground: true
        });
        await browser.close();

        // C. Upload para o Google Drive
        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(caminhoPdfTemp)
        };

        const driveResponse = await drive.files.create({
            resource: {
                name: nomeArquivo,
                parents: [PASTA_DRIVE_ID]
            },
            media: media,
            fields: 'id, webViewLink'
        });

        // Limpeza de arquivo temporário
        fs.unlinkSync(caminhoPdfTemp);

        console.log(`[LOG] PDF enviado ao Drive com sucesso: ${driveResponse.data.webViewLink}`);
        return res.json({
            sucesso: true,
            linkDrive: driveResponse.data.webViewLink
        });

    } catch (erro) {
        console.error('[ERRO] Falha no processamento:', erro);
        return res.status(500).json({ erro: erro.message });
    }
});

// ==========================================
// TEMPLATE HTML DO PDF
// ==========================================
function gerarHtmlRelatorio(data, relatos) {
    const frentes = [...new Set(relatos.map(r => r.projeto))].join(', ');
    
    let htmlAtividades = '';
    relatos.forEach(r => {
        htmlAtividades += `
            <div style="margin-bottom: 15px;">
                <strong>${r.membro} — ${r.projeto}</strong>
                <p style="margin: 5px 0 0 0; white-space: pre-line;">${r.atividades}</p>
            </div>
        `;
    });

    let htmlImpedimentos = '';
    const comImpedimento = relatos.filter(r => r.dificuldades && r.dificuldades.trim() !== '');
    if (comImpedimento.length > 0) {
        comImpedimento.forEach((r, idx) => {
            htmlImpedimentos += `
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">D${idx + 1} - ${r.membro} (${r.projeto})</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${r.dificuldades}</td>
                </tr>
            `;
        });
    } else {
        htmlImpedimentos = `<tr><td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px;">Nenhum impedimento relatado no dia.</td></tr>`;
    }

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.5; }
                h1 { font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; color: #0f172a; }
                h2 { font-size: 14px; margin-top: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Software House — Relatório Diário (${data})</h1>
            
            <table>
                <tr><th style="width: 25%;">Data</th><td>${data}</td></tr>
                <tr><th>Frente(s)</th><td>${frentes}</td></tr>
                <tr><th>Instituição</th><td>Centro Universitário de Várzea Grande - UNIVAG</td></tr>
                <tr><th>Professor responsável</th><td>Lázaro Manoel da Silva Filho</td></tr>
            </table>

            <h2>1. Atividades do Dia</h2>
            ${htmlAtividades}

            <h2>2. Dificuldades e Impedimentos Encontrados</h2>
            <table>
                <thead>
                    <tr><th style="width: 35%;">Item / Membro</th><th>Descrição</th></tr>
                </thead>
                <tbody>
                    ${htmlImpedimentos}
                </tbody>
            </table>

            <p style="margin-top: 30px; font-size: 10px; color: #64748b; text-align: center;">
                Documento interno — uso exclusivo da equipe Software House UNIVAG
            </p>
        </body>
        </html>
    `;
}

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`[OK] Servidor rodando na porta ${PORT}`);
});