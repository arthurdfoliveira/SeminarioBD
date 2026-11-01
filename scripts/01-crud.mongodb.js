// =============================================================
// 01 - CRUD (Create, Read, Update, Delete)
// Banco: catalogo | Coleção: filmes
//
// Como rodar na apresentação: selecione um bloco, clique com o
// botão direito e escolha "MongoDB: Run Selected Lines From Playground".
// Os documentos de demonstração levam demo: true, para apagar no final.
// =============================================================

use('catalogo');

// -------------------------------------------------------------
// CREATE
// -------------------------------------------------------------

// C1. Inserir um filme. Note que "streaming" não existe em nenhum outro
// documento: o MongoDB aceita sem alterar estrutura (esquema flexível).
db.filmes.insertOne({
  titulo: "O Auto da Compadecida",
  ano: 2000,
  generos: ["Comedy", "Drama"],
  nota: 8.6,
  direcao: ["Guel Arraes"],
  elenco: [
    { ator: "Matheus Nachtergaele", personagem: "João Grilo", ordem: 0 },
    { ator: "Selton Mello", personagem: "Chicó", ordem: 1 }
  ],
  streaming: ["Globoplay"],
  demo: true
});

// C2. Inserir vários de uma vez, cada um com campos diferentes
db.filmes.insertMany([
  { titulo: "Cidade de Deus", ano: 2002, generos: ["Crime", "Drama"], nota: 8.6, demo: true },
  { titulo: "Bacurau", ano: 2019, generos: ["Thriller"], premios: ["Prêmio do Júri - Cannes"], demo: true }
]);

// -------------------------------------------------------------
// READ
// -------------------------------------------------------------

// R1. Buscar os filmes inseridos (com projeção: só alguns campos)
db.filmes.find({ demo: true }, { _id: 0, titulo: 1, ano: 1, generos: 1 });

// R2. Filtro em array e em número: filmes de ação lançados a partir de 2010
// com nota maior ou igual a 7, do mais bem avaliado para o pior
db.filmes.find(
  { generos: "Action", ano: { $gte: 2010 }, nota: { $gte: 7 } },
  { _id: 0, titulo: 1, ano: 1, nota: 1 }
).sort({ nota: -1 }).limit(10);

// R3. Filtro em campo aninhado (notação de ponto): orçamento acima de 200 milhões
db.filmes.find(
  { "financeiro.orcamento": { $gt: 200000000 } },
  { _id: 0, titulo: 1, "financeiro.orcamento": 1 }
).sort({ "financeiro.orcamento": -1 });

// R4. Filtro dentro de array de objetos: filmes com Tom Hanks no elenco
db.filmes.find(
  { "elenco.ator": "Tom Hanks" },
  { _id: 0, titulo: 1, ano: 1 }
).sort({ ano: 1 });

// R5. Contar documentos
db.filmes.countDocuments({ generos: "Animation" });

// -------------------------------------------------------------
// UPDATE
// -------------------------------------------------------------

// U1. Alterar um campo e adicionar um item a um array
db.filmes.updateOne(
  { titulo: "O Auto da Compadecida", demo: true },
  { $set: { nota: 9.0 }, $push: { streaming: "Netflix" } }
);
db.filmes.findOne({ titulo: "O Auto da Compadecida", demo: true }, { _id: 0, titulo: 1, nota: 1, streaming: 1 });

// U2. Atualizar vários: marcar como "classico" todos os filmes antes de 1970
db.filmes.updateMany({ ano: { $lt: 1970 } }, { $set: { classico: true } });
db.filmes.countDocuments({ classico: true });

// U3. Remover um campo de vários documentos ($unset)
db.filmes.updateMany({ classico: true }, { $unset: { classico: "" } });

// -------------------------------------------------------------
// DELETE
// -------------------------------------------------------------

// D1. Apagar um documento
db.filmes.deleteOne({ titulo: "Bacurau", demo: true });

// D2. Apagar todos os documentos de demonstração (deixa o banco como estava)
db.filmes.deleteMany({ demo: true });
