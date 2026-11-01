// =============================================================
// 03 - Índices: antes e depois
// Banco: catalogo | Coleção: filmes
//
// Mostra quantos documentos o MongoDB precisa examinar para responder
// a mesma consulta, sem índice (varre a coleção inteira) e com índice.
// Rode um bloco por vez (seleção + "Run Selected Lines From Playground").
// =============================================================

use('catalogo');

// Função auxiliar: resume o explain() nos números que interessam
function resumo(consulta) {
  const r = consulta.explain("executionStats");
  const plano = JSON.stringify(r.queryPlanner.winningPlan);
  return {
    usou_indice: plano.includes("IXSCAN"),
    estrategia: plano.includes("IXSCAN") ? "IXSCAN (índice)" : "COLLSCAN (varredura completa)",
    documentos_examinados: r.executionStats.totalDocsExamined,
    documentos_retornados: r.executionStats.nReturned,
    tempo_ms: r.executionStats.executionTimeMillis
  };
}

// -------------------------------------------------------------
// I0. Preparação: remove os índices de demonstração, caso existam
// -------------------------------------------------------------
db.filmes.dropIndexes();   // apaga todos, exceto o _id
db.filmes.getIndexes();

// -------------------------------------------------------------
// I1. ANTES: buscar filmes por ator, sem índice
// -------------------------------------------------------------
resumo(db.filmes.find({ "elenco.ator": "Tom Hanks" }));

// -------------------------------------------------------------
// I2. Criar índice no campo dentro do array de objetos
// (índice multikey: uma entrada para cada ator de cada filme)
// -------------------------------------------------------------
db.filmes.createIndex({ "elenco.ator": 1 });

// -------------------------------------------------------------
// I3. DEPOIS: a mesma consulta
// -------------------------------------------------------------
resumo(db.filmes.find({ "elenco.ator": "Tom Hanks" }));

// -------------------------------------------------------------
// I4. Índice composto: gênero + nota (filtro e ordenação juntos)
// -------------------------------------------------------------
resumo(db.filmes.find({ generos: "Horror" }).sort({ nota: -1 }));
db.filmes.createIndex({ generos: 1, nota: -1 });
resumo(db.filmes.find({ generos: "Horror" }).sort({ nota: -1 }));

// -------------------------------------------------------------
// I5. Índice de texto: busca por palavras no título e na sinopse
// (só pode existir um índice de texto por coleção)
// -------------------------------------------------------------
db.filmes.createIndex({ titulo: "text", sinopse: "text" });

db.filmes.find(
  { $text: { $search: "space alien war" } },
  { _id: 0, titulo: 1, ano: 1, relevancia: { $meta: "textScore" } }
).sort({ relevancia: { $meta: "textScore" } }).limit(10);

// -------------------------------------------------------------
// I6. Listar todos os índices criados
// -------------------------------------------------------------
db.filmes.getIndexes();
