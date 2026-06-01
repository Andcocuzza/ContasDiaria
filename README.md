# ContaDiárias

Uma aplicação leve para controle de entradas, saídas e dívidas recorrentes.

## O que faz

- Registra lançamentos de receita, despesa, dívida e pagamento.
- Exibe saldo, totais diários, dívidas pendentes e dicas de quanto guardar.
- Atualiza automaticamente categorias e permite adicionar categorias personalizadas.
- Aceita valores em formatos como `150`, `150,00`, `150.00` e `1.234,56`.
- Permite marcar dívidas recorrentes e aplicar débitos mensais.
- Exporta e importa lançamentos em CSV.

## Arquivos principais

- `index.html` - interface principal e lógica de formulário.
- `styles.css` - estilos visuais e layout responsivo.
- `features.js` - funcionalidades de débitos recorrentes, backup e relatórios.
- `manifest.json` - metadados para instalação como web app.
- `generate_icon.py` - script auxiliar para gerar ícones.

## Como usar

1. Abra `index.html` no navegador.
2. Preencha a data, valor, tipo, descrição e categoria.
3. Clique em `Salvar lançamento`.
4. Para gerenciar categorias, use a seção `Gerenciar categorias`.
5. Para registrar dívidas recorrentes, vá até a aba `Débitos Recorrentes`.

## Notas

- O valor pode ser digitado como número inteiro e será lido como centavos automaticamente.
- O painel de categoria foi ajustado para ficar discreto e abrir apenas quando necessário.

## Desenvolvimento

- Basta editar os arquivos HTML, CSS e JavaScript.
- Use um servidor local ou abra diretamente o arquivo `index.html`.

---

Desenvolvido para uso pessoal e controle financeiro diário.
