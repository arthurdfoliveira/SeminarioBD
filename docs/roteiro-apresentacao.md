# Roteiro da apresentação - Grupo 1.2 (MongoDB)

Data: 05/11. Tempo permitido: 20 a 30 min. Meta: 25 min, para sobrar folga para perguntas
ou algum imprevisto na demo.

## Divisão de falas e tempo

| Parte | Quem | Tempo | Conteúdo |
|---|---|---|---|
| 1. Fundamentação teórica | Artur | 6 min | O que é NoSQL e o modelo orientado a documentos, JSON/BSON, esquema flexível, vantagens, desvantagens e casos de uso no mercado |
| 2. O SGBD: MongoDB | Bruno | 4 min | Banco, coleção e documento (comparando com tabela e linha), `_id`, BSON, arquitetura básica: `mongod`, drivers, replica set e sharding |
| 3. Modelagem e ingestão | Bruno | 4 min | Dataset TMDB 5000 (2 CSVs), conversão com o `converter.py`, decisões de modelagem, importação com Docker / Compass / mongoimport |
| 4. Demonstração prática | Matheus | 9 min | CRUD, consultas complexas e índices, rodando os playgrounds ao vivo |
| 5. Conclusão | Artur | 2 min | Resumo do que foi mostrado, quando usar e quando não usar MongoDB, abrir para perguntas |
| **Total** | | **25 min** | |

Se o tempo apertar, cortar na demo: pular R3, R5, Q4 e Q6, e mostrar o I5 (índice de
texto) só se sobrar tempo.

### Pontos de cada parte

**1. Teoria (Artur)**
- NoSQL não é "contra SQL", é outro jeito de modelar. Os 4 modelos principais: documentos,
  chave-valor, colunas e grafos.
- Documento = um objeto JSON com campos, objetos aninhados e arrays.
- Esquema flexível: documentos da mesma coleção podem ter campos diferentes.
- Vantagens: modelo parecido com os objetos da aplicação, leitura de tudo de uma vez,
  escala horizontal, evolução fácil do esquema.
- Desvantagens: dados duplicados, JOINs limitados (`$lookup`), integridade fica mais por
  conta da aplicação.
- Casos de uso: catálogos de produtos, perfis de usuário, gerenciamento de conteúdo,
  apps mobile, logs e eventos.

**2. MongoDB (Bruno)**
- Hierarquia: servidor > banco > coleção > documento.
- BSON: JSON binário, com tipos a mais (Date, ObjectId, Long, Decimal128).
- Todo documento tem `_id` único (gerado automaticamente como ObjectId se não for informado).
- Replica set para alta disponibilidade, sharding para escalar horizontalmente (só
  comentar, não usamos no trabalho).
- Ferramentas: `mongosh`, Compass, extensão do VS Code.

**3. Modelagem e ingestão (Bruno)**
- O dataset vem em `tmdb_5000_movies.csv` e `tmdb_5000_credits.csv`, com gêneros, elenco
  e equipe guardados como texto JSON dentro das células.
- O `converter.py` junta os dois arquivos e gera um documento por filme (4803 no total).
- Mostrar um documento no Compass (ex.: Avatar): `generos` (array), `financeiro`
  (objeto), `elenco` (array de objetos).
- Decisões: embutir em vez de referenciar, elenco limitado a 10, campos ausentes em vez
  de null (890 filmes sem `financeiro`). Detalhes no README.
- Ingestão: `docker compose up -d` importa sozinho; alternativa pelo Compass ("Add Data"),
  que é o caminho do roteiro do professor.

## Checklist antes de apresentar

Na véspera:
- [ ] `git pull` na máquina que vai ser usada na apresentação.
- [ ] `docker compose up -d` e conferir `countDocuments()` = 4803.
- [ ] Rodar os 3 playgrounds inteiros uma vez e conferir os números da tabela abaixo.
- [ ] Ensaiar com cronômetro pelo menos uma vez.
- [ ] Ter um plano B: prints dos resultados nos slides, caso o Docker ou a rede falhe.

No dia, antes de começar:
- [ ] Docker Desktop aberto e container `seminario-mongo` rodando (`docker ps`).
- [ ] Coleção com 4803 documentos (se tiver mais, rodar o D2 do `01-crud`).
- [ ] VS Code aberto com a extensão do MongoDB conectada em `localhost:27017`.
- [ ] Os 3 playgrounds abertos em abas, na ordem 01, 02, 03.
- [ ] Compass aberto na coleção `catalogo.filmes` (para mostrar um documento na parte 3).
- [ ] Fonte do VS Code aumentada (Ctrl + =) para a turma conseguir ler.
- [ ] Notificações do computador desligadas.

## Ordem dos blocos na demonstração

Rodar com seleção + botão direito > "MongoDB: Run Selected Lines From Playground".
Quando a seleção tem mais de um comando, o playground mostra só o resultado do último.

**01-crud.mongodb.js** (cerca de 3 min)

| Bloco | O que mostrar | Resultado esperado |
|---|---|---|
| C1 | Insert com o campo `streaming`, que nenhum outro filme tem | `acknowledged: true` |
| C2 | insertMany com documentos de campos diferentes (Bacurau tem `premios`) | 2 ids inseridos |
| R1 | find com projeção | os 3 filmes inseridos |
| R2 | filtro em array + número, com sort e limit | Inception (8.1) no topo |
| R4 | busca dentro de array de objetos (`elenco.ator`) | 30 filmes do Tom Hanks, de Splash (1984) em diante |
| U1 | `$set` + `$push` | nota 9, streaming com Globoplay e Netflix |
| U2 | updateMany | 143 filmes antes de 1970 |
| U3 | `$unset` | 143 modificados |
| D1 | deleteOne | `deletedCount: 1` |
| D2 | deleteMany dos `demo: true` | `deletedCount: 2`, coleção volta a 4803 |

Opcionais se sobrar tempo: R3 (campo aninhado `financeiro.orcamento`) e R5 (234 animações).

**02-consultas-complexas.mongodb.js** (cerca de 4 min)

| Bloco | O que mostrar | Resultado esperado |
|---|---|---|
| Q1 | `$unwind` + `$group`: nota média por gênero | Documentary 7.03 no topo, Horror 5.88 no fim |
| Q2 | lucro (receita - orçamento) por diretor | Steven Spielberg em 1º, cerca de 7,48 bi em 27 filmes |
| Q3 | atores mais presentes em filmes bem avaliados | Tom Hanks e Morgan Freeman com 8 cada |
| Q5 | `$elemMatch`: DiCaprio como protagonista (ordem 0) | 16 filmes |

Opcionais: Q4 (evolução por década) e Q6 (`$all`, Ação + Ficção Científica).

Na Q5, explicar a diferença: sem o `$elemMatch`, a consulta
`{ "elenco.ator": "Leonardo DiCaprio", "elenco.ordem": 0 }` aceitaria filmes em que o
DiCaprio está no elenco e *outro* ator tem ordem 0. Sem o `$elemMatch` saem 22 filmes;
com ele, 16.

**03-indices.mongodb.js** (cerca de 2 min)

Rodar **uma linha por vez**, principalmente no I4. As linhas com `resumo(...)` usam a
função definida no começo do arquivo: para não dar erro de "resumo is not defined",
selecionar a função junto com a linha (o resultado mostrado é o da última linha).

| Bloco | Resultado esperado |
|---|---|
| I0 | só o índice `_id_` |
| I1 (antes) | COLLSCAN, 4803 documentos examinados, 30 retornados |
| I2 | cria `elenco.ator_1` |
| I3 (depois) | IXSCAN, 30 documentos examinados, 30 retornados |
| I4 linha 1 (antes) | COLLSCAN, 4803 examinados, 519 retornados |
| I4 linha 2 | cria `generos_1_nota_-1` |
| I4 linha 3 (depois) | IXSCAN, 519 examinados, 519 retornados |
| I5 (opcional) | busca "space alien war" por relevância |

O ponto principal é o número de documentos examinados (4803 contra 30). O `tempo_ms`
fica parecido nos dois casos porque a coleção é pequena e cabe toda na memória; vale
comentar que a diferença aparece com milhões de documentos.

## Perguntas prováveis

**Quando não usar MongoDB?**
Quando os dados são muito relacionados entre si e as consultas dependem de vários JOINs
(ex.: um ERP), quando é preciso transações complexas envolvendo muitas tabelas o tempo
todo (ex.: sistema bancário), ou quando o esquema é fixo e bem conhecido e a integridade
referencial é essencial. Nesses casos um banco relacional costuma ser melhor. O MongoDB
tem transações multi-documento desde a versão 4.0, mas não é o ponto forte dele.

**Embutir ou referenciar?**
Embutir quando os dados são lidos junto com o documento principal, pertencem a ele e
têm tamanho limitado (relação 1 para poucos), como gêneros e elenco principal de um
filme. Referenciar (guardar o `_id` de outro documento) quando os dados são grandes,
crescem sem limite, mudam muito ou são compartilhados e precisam ser atualizados num
lugar só. Exemplo: avaliações de usuários de um filme, que podem ser milhares, iriam
numa coleção separada com o `filme_id`, e o `$lookup` junta quando precisar.

**E o limite de 16 MB por documento?**
É o tamanho máximo de um documento BSON. Serve justamente para evitar documentos que
crescem sem controle. No nosso caso não chega nem perto: o maior documento tem cerca de
3,6 KB e a média é 1,7 KB, em parte porque limitamos o elenco a 10. Para arquivos
grandes (vídeos, imagens) existe o GridFS, que divide o arquivo em pedaços.

**Esquema flexível quer dizer que não dá para validar nada?**
Não. Dá para criar a coleção com um validador `$jsonSchema`, dizendo quais campos são
obrigatórios e os tipos de cada um. Exemplo:

```js
db.createCollection("filmes", { validator: { $jsonSchema: {
  bsonType: "object",
  required: ["titulo", "generos"],
  properties: {
    titulo: { bsonType: "string" },
    nota: { bsonType: ["double", "int"], minimum: 0, maximum: 10 }
  }
} } });
```

A flexibilidade fica para os campos que não estão no schema. Não usamos no trabalho
porque a ideia era mostrar o esquema flexível, mas em produção é comum usar.

**O que é replica set e sharding?**
Replica set é um grupo de servidores com a mesma cópia dos dados: um primário recebe as
escritas e os secundários replicam. Se o primário cai, os outros elegem um novo
automaticamente, então serve para alta disponibilidade. Sharding é dividir a coleção
entre vários servidores (shards) usando uma chave de shard, para escalar horizontalmente
quando os dados ou a carga não cabem numa máquina só. No trabalho usamos um servidor
único, porque 4803 documentos não precisam disso.

**Por que os gêneros estão em inglês?**
Vieram assim do dataset original e preferimos não traduzir na conversão. Os nomes dos
campos foram traduzidos para português.

**Por que não usaram o Compass para a demo inteira?**
O Compass foi usado para a importação e para mostrar os documentos. Os playgrounds no
VS Code deixam as consultas salvas no repositório, então dá para repetir exatamente a
mesma demonstração e qualquer pessoa consegue rodar depois.
