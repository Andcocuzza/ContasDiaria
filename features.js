// Dívidas recorrentes e recursos avançados
const RECURRING_KEY = 'contadiarias-recorrentes';
const BACKUP_KEY = 'contadiarias-backup';
let recorrentes = [];
let chartsInstances = { gastos: null, categories: null };

function abrirAba(abaName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`aba-${abaName}`).classList.add('active');
    document.querySelector(`[onclick="abrirAba('${abaName}')"]`).classList.add('active');

    if (abaName === 'relatorios') {
        setTimeout(atualizarRelatorios, 100);
    }
}

// ===== DÍVIDAS RECORRENTES =====
function salvarRecorrentes() {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recorrentes));
}

function carregarRecorrentes() {
    const salvo = localStorage.getItem(RECURRING_KEY);
    if (!salvo) return;
    try {
        recorrentes = JSON.parse(salvo);
        renderizarRecorrentes();
    } catch (e) {
        console.warn('Erro ao carregar recorrentes', e);
    }
}

function adicionarRecorrente() {
    const descricao = document.getElementById('inputRecDescricao').value.trim();
    const valor = parseFloat(document.getElementById('inputRecValor').value.replace(',', '.'));
    const categoria = document.getElementById('inputRecCategoria').value;

    if (!descricao || !valor || isNaN(valor) || valor <= 0 || !categoria) {
        alert('Preencha descrição, valor e categoria.');
        return;
    }

    recorrentes.push({ descricao, valor, categoria, id: Date.now() });
    salvarRecorrentes();
    renderizarRecorrentes();
    document.getElementById('inputRecDescricao').value = '';
    document.getElementById('inputRecValor').value = '';
    document.getElementById('inputRecCategoria').value = '';
}

function deletarRecorrente(id) {
    recorrentes = recorrentes.filter(r => r.id !== id);
    salvarRecorrentes();
    renderizarRecorrentes();
}

function renderizarRecorrentes() {
    const container = document.getElementById('listaRecorrentes');
    if (recorrentes.length === 0) {
        container.innerHTML = '<p style="color:var(--muted); text-align:center;">Nenhum débito recorrente cadastrado</p>';
        return;
    }

    container.innerHTML = recorrentes.map(r => `
        <div class="recurringDebtItem">
            <div class="recurringDebtInfo">
                <strong>${r.descricao}</strong>
                <small>${r.categoria} • ${formatarDinheiro(r.valor)}/mês</small>
            </div>
            <button class="btn-small danger" onclick="deletarRecorrente(${r.id})">Remover</button>
        </div>
    `).join('');
}

function aplicarRecorrentesEsteMes() {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const aplicadosKey = `contadiarias-recorrentes-aplicados-${mesAtual}`;

    if (localStorage.getItem(aplicadosKey)) {
        alert('Débitos recorrentes deste mês já foram aplicados!');
        return;
    }

    const primeiroDoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
    recorrentes.forEach(r => {
        lancamentos.push({
            data: primeiroDoMes,
            valor: r.valor,
            tipo: 'divida',
            descricao: `[Recorrente] ${r.descricao}`,
            categoria: r.categoria
        });
    });

    salvarLocal();
    localStorage.setItem(aplicadosKey, 'true');
    renderizarTabela();
    atualizarResumo();
    alert(`${recorrentes.length} débitos recorrentes aplicados ao 1º do mês!`);
}

// ===== RELATÓRIOS E GRÁFICOS =====
function atualizarRelatorios() {
    const periodos = parseInt(document.getElementById('periodoRelatorio').value) || 30;
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodos);
    const dataLimiteStr = dataLimite.toISOString().slice(0, 10);

    const filtrados = lancamentos.filter(l => l.data >= dataLimiteStr);

    // Calcular totais
    const receita = filtrados.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0);
    const despesa = filtrados.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0);
    const pagamentos = filtrados.filter(l => l.tipo === 'pagamento').reduce((sum, l) => sum + l.valor, 0);
    const resultado = receita - despesa - pagamentos;
    const mediaGasto = filtrados.length > 0 ? (despesa + pagamentos) / filtrados.length : 0;

    document.getElementById('relReceitaTotal').textContent = formatarDinheiro(receita);
    document.getElementById('relDespesaTotal').textContent = formatarDinheiro(despesa + pagamentos);
    document.getElementById('relResultado').textContent = formatarDinheiro(resultado);
    document.getElementById('relMediaGasto').textContent = formatarDinheiro(mediaGasto);

    renderizarGraficos(filtrados);
}

function renderizarGraficos(dados) {
    // Gráfico de gastos por dia
    const porDia = {};
    dados.forEach(l => {
        porDia[l.data] = (porDia[l.data] || 0) + (l.tipo === 'receita' ? l.valor : -l.valor);
    });

    const diasOrdenados = Object.keys(porDia).sort();
    const valoresPorDia = diasOrdenados.map(d => porDia[d]);

    if (chartsInstances.gastos) chartsInstances.gastos.destroy();
    const ctxGastos = document.getElementById('chartGastos').getContext('2d');
    chartsInstances.gastos = new Chart(ctxGastos, {
        type: 'line',
        data: {
            labels: diasOrdenados.map(d => new Date(d).toLocaleDateString('pt-BR')),
            datasets: [{
                label: 'Fluxo Diário (Receita - Despesa)',
                data: valoresPorDia,
                borderColor: '#f8d44b',
                backgroundColor: 'rgba(248, 212, 75, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f7f0c8' } } }, scales: { y: { ticks: { color: '#d7cf9e' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#d7cf9e' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });

    // Gráfico de despesas por categoria
    const porCategoria = {};
    dados.filter(l => l.tipo !== 'receita').forEach(l => {
        porCategoria[l.categoria] = (porCategoria[l.categoria] || 0) + l.valor;
    });

    const categorias = Object.keys(porCategoria);
    const valores = Object.values(porCategoria);
    const cores = ['#ff9aa1', '#8bffcb', '#f8d44b', '#ffa07a', '#87ceeb', '#98fb98'];

    if (chartsInstances.categories) chartsInstances.categories.destroy();
    const ctxCat = document.getElementById('chartCategories').getContext('2d');
    chartsInstances.categories = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: cores.slice(0, categorias.length)
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#f7f0c8' } } } }
    });
}

// ===== BACKUP =====
function fazerBackupDownload() {
    const backup = {
        data: new Date().toISOString(),
        lancamentos: lancamentos,
        recorrentes: recorrentes,
        versao: 1
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dataStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `contadiarias-backup-${dataStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Backup baixado com sucesso!');
}

function restaurarBackup() {
    document.getElementById('inputBackupFile').click();
}

document.addEventListener('DOMContentLoaded', () => {
    const inputFile = document.getElementById('inputBackupFile');
    if (inputFile) {
        inputFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    if (!backup.lancamentos || !Array.isArray(backup.lancamentos)) {
                        alert('Arquivo de backup inválido!');
                        return;
                    }

                    lancamentos = backup.lancamentos;
                    recorrentes = backup.recorrentes || [];
                    salvarLocal();
                    salvarRecorrentes();
                    renderizarTabela();
                    renderizarRecorrentes();
                    atualizarResumo();
                    alert('Backup restaurado com sucesso!');
                } catch (e) {
                    alert('Erro ao ler o arquivo de backup: ' + e.message);
                }
            };
            reader.readAsText(file);
        });
    }

    // Carregar recorrentes ao abrir
    carregarRecorrentes();

    // Botões
    const btnAdicionarRec = document.getElementById('btnAdicionarRecorrente');
    const btnAplicarRec = document.getElementById('btnAplicarRecorrentes');
    const btnBackupDown = document.getElementById('btnBackupDownload');
    const btnBackupUp = document.getElementById('btnBackupUpload');
    const periodoInput = document.getElementById('periodoRelatorio');

    if (btnAdicionarRec) btnAdicionarRec.addEventListener('click', adicionarRecorrente);
    if (btnAplicarRec) btnAplicarRec.addEventListener('click', aplicarRecorrentesEsteMes);
    if (btnBackupDown) btnBackupDown.addEventListener('click', fazerBackupDownload);
    if (btnBackupUp) btnBackupUp.addEventListener('click', restaurarBackup);
    if (periodoInput) periodoInput.addEventListener('change', atualizarRelatorios);
});
