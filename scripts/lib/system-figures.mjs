const diagrams = {
  "au-jour-le-jour": {
    kind: "storage",
    it: ["Due modelli di archiviazione", [["Edizione web", "Registro nel browser"], ["Edizione locale", "Registro in SQLite"]], "Backup leggibili e condivisione domestica facoltativa. Nessun collegamento alla banca e nessun trasferimento di denaro."],
    en: ["Two storage models", [["Web edition", "Ledger in browser storage"], ["Local edition", "Ledger in SQLite"]], "Readable backups and optional household sharing. No bank connections and no movement of money."],
    fr: ["Deux modèles de stockage", [["Édition web", "Registre dans le navigateur"], ["Édition locale", "Registre dans SQLite"]], "Sauvegardes lisibles et partage domestique facultatif. Aucune connexion bancaire ni aucun mouvement d’argent."],
    pt: ["Dois modelos de armazenamento", [["Edição web", "Registo no navegador"], ["Edição local", "Registo em SQLite"]], "Cópias legíveis e partilha doméstica opcional. Sem ligações bancárias nem movimentação de dinheiro."]
  },
  chattypatty: {
    kind: "distributed",
    it: ["Tre servizi, responsabilità distinte", [["Gateway", "Normalizza e misura"], ["Scheduler", "Assegna lease e verifica ricevute"], ["Provider", "Esegue l’inferenza e pubblica attestazioni"]], "Gli impegni crittografici delle ricevute collegano richiesta, risultato e misurazione. I contratti Sonic gestiscono escrow, contestazione e regolamento."],
    en: ["Three services, separate responsibilities", [["Gateway", "Normalize and meter"], ["Scheduler", "Assign leases and verify receipts"], ["Provider", "Run inference and publish attestations"]], "Receipt commitments bind request, result, and metering. Sonic contracts govern escrow, challenge, and settlement."],
    fr: ["Trois services, des responsabilités distinctes", [["Passerelle", "Normaliser et mesurer"], ["Ordonnanceur", "Attribuer les baux et vérifier les reçus"], ["Fournisseur", "Exécuter l’inférence et publier les attestations"]], "Les engagements cryptographiques des reçus lient demande, résultat et mesure. Les contrats Sonic gèrent le séquestre, la contestation et le règlement."],
    pt: ["Três serviços, responsabilidades distintas", [["Gateway", "Normalizar e medir"], ["Scheduler", "Atribuir leases e verificar recibos"], ["Fornecedor", "Executar inferência e publicar atestações"]], "Os compromissos criptográficos dos recibos ligam pedido, resultado e medição. Os contratos Sonic gerem escrow, contestação e liquidação."]
  },
  respometer: {
    kind: "revision",
    it: ["L’evidenza può cambiare una valutazione", [["Fonte", "Link, testo e contesto"], ["Revisione editoriale", "Evidenza proposta e decisione dell’editor"], ["Valutazione", "Attori, punteggi e confidenza"], ["Cronologia", "Revisioni e audit dei punteggi"]], "Il percorso conserva le fonti e le revisioni quando cambia la lettura pubblica di un evento."],
    en: ["Evidence can change an assessment", [["Source", "Links, text, and context"], ["Editorial review", "Proposed evidence and editor decision"], ["Assessment", "Actors, scores, and confidence"], ["History", "Revisions and score audits"]], "The path preserves sources and revisions when the public reading of an event changes."],
    fr: ["Les preuves peuvent modifier une évaluation", [["Source", "Liens, texte et contexte"], ["Revue éditoriale", "Preuves proposées et décision de l’éditeur"], ["Évaluation", "Acteurs, scores et confiance"], ["Historique", "Révisions et audits des scores"]], "Le parcours conserve les sources et les révisions lorsque la lecture publique d’un événement évolue."],
    pt: ["A evidência pode mudar uma avaliação", [["Fonte", "Links, texto e contexto"], ["Revisão editorial", "Evidência proposta e decisão do editor"], ["Avaliação", "Atores, pontuações e confiança"], ["Histórico", "Revisões e auditorias de pontuação"]], "O percurso preserva fontes e revisões quando muda a leitura pública de um acontecimento."]
  },
  galidima: {
    kind: "inference",
    it: ["I registri restano separati dalle risposte", [["Fonti", "Registri autorevoli e provenienza"], ["Contesto", "Retrieval circoscritto e budget espliciti"], ["Inferenza", "Provider locale e gestione degli errori"], ["Verifica", "Controllo delle affermazioni e correzioni"]], "Calcoli e dati finanziari seguono strumenti deterministici. Le risposte contestate non rientrano nel contesto come fatti."],
    en: ["Records stay separate from answers", [["Sources", "Authoritative records and provenance"], ["Context", "Scoped retrieval and explicit budgets"], ["Inference", "Local provider and failure handling"], ["Verification", "Claim checks and corrections"]], "Calculations and financial data follow deterministic tools. Contested answers are not reused as facts in later context."],
    fr: ["Les registres restent séparés des réponses", [["Sources", "Registres de référence et provenance"], ["Contexte", "Récupération limitée et budgets explicites"], ["Inférence", "Fournisseur local et gestion des pannes"], ["Vérification", "Contrôle des affirmations et corrections"]], "Les calculs et données financières passent par des outils déterministes. Les réponses contestées ne sont pas réutilisées comme des faits dans le contexte."],
    pt: ["Os registos ficam separados das respostas", [["Fontes", "Registos de referência e proveniência"], ["Contexto", "Recuperação limitada e orçamentos explícitos"], ["Inferência", "Fornecedor local e gestão de falhas"], ["Verificação", "Verificação de afirmações e correções"]], "Os cálculos e dados financeiros usam ferramentas determinísticas. As respostas contestadas não voltam ao contexto como factos."]
  }
};
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function renderArchitecture(slug, lang) {
  const diagram = diagrams[slug];
  if (!diagram) return "";
  const [title, nodes, note] = diagram[lang] || diagram.en;
  return `<figure class="architecture-figure architecture--${diagram.kind}" aria-labelledby="architecture-${slug}">
        <figcaption id="architecture-${slug}">${escape(title)}</figcaption>
        <dl>${nodes.map(([name, description]) => `<div><dt>${escape(name)}</dt><dd>${escape(description)}</dd></div>`).join("")}</dl>
        <p>${escape(note)}</p>
      </figure>`;
}
