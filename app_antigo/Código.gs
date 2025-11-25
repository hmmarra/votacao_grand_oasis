function doGet(e) {
  var view = (e && e.parameter && e.parameter.view) ? String(e.parameter.view) : 'pautas';
  var tipo = (e && e.parameter && e.parameter.tipo) ? String(e.parameter.tipo) : '';
  var file = 'pautas';
  if (view === 'index') file = 'index';
  if (view === 'placar') file = 'placar';
  if (view === 'subsindico') file = 'subsindico';
  if (view === 'placarsubsindico') file = 'placarsubsindico';
  // Login agora está integrado no admin.html, então ambos carregam o mesmo arquivo
  if (view === 'login' || view === 'admin') file = 'admin';
  var output = HtmlService.createHtmlOutputFromFile(file)
    .setTitle('Sistema de Votação')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  // Passa o tipo de votação para o HTML
  if (tipo) {
    output.append('<script>window.votingType = "' + tipo + '";</script>');
  }
  return output;
}

function readData() {
  var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('BaseDados');
  return sheet.getDataRange().getValues();
}

function normalizeCPF_(value) {
  return String(value || '').replace(/\D/g, '');
}

function getHeaderColumnByName_(sheet, headerName) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < header.length; i++) {
    if (String(header[i]).trim().toLowerCase() === String(headerName).trim().toLowerCase()) {
      return i + 1; // 1-based
    }
  }
  return 0;
}

// -------- Funções Genéricas de Votação --------
function getVoterFromMoradores(cpf) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var moradoresSheet = ss.getSheetByName('moradores');
    if (!moradoresSheet) {
      throw new Error('Aba "moradores" não encontrada!');
    }
    var data = moradoresSheet.getDataRange().getValues();
    var target = normalizeCPF_(cpf);
    for (var i = 1; i < data.length; i++) {
      if (normalizeCPF_(String(data[i][0] || '')) === target) {
        return {
          cpf: target,
          nome: String(data[i][1] || '').trim(),
          apartamento: String(data[i][2] || '').trim(),
          torre: String(data[i][3] || '').trim()
        };
      }
    }
    throw new Error('CPF não encontrado na lista de moradores!');
  } catch (e) {
    Logger.log('Erro em getVoterFromMoradores: ' + e.message);
    throw e;
  }
}

function getVoterStatus(cpf, tipoVotacao) {
  try {
    var voter = getVoterFromMoradores(cpf);
    
    // Busca a pauta para obter o nome correto da aba
    var pauta = getPautaByAba(tipoVotacao);
    var abaNome = tipoVotacao;
    if (pauta && pauta.aba) {
      abaNome = pauta.aba;
    }
    
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var votacaoSheet = ss.getSheetByName(abaNome);
    if (!votacaoSheet) {
      // Se a aba não existe, o eleitor ainda não votou
      return {
        cpf: voter.cpf,
        nome: voter.nome,
        apartamento: voter.apartamento,
        torre: voter.torre,
        votou: false,
        voto: ''
      };
    }
    var data = votacaoSheet.getDataRange().getValues();
    var target = normalizeCPF_(cpf);
    var votou = false;
    var voto = '';
    for (var i = 1; i < data.length; i++) {
      if (normalizeCPF_(String(data[i][0] || '')) === target) {
        if (data[i][4]) { // Coluna E (índice 4) tem o voto
          votou = true;
          voto = String(data[i][4] || '').trim();
          break;
        }
      }
    }
    return {
      cpf: voter.cpf,
      nome: voter.nome,
      apartamento: voter.apartamento,
      torre: voter.torre,
      votou: votou,
      voto: voto
    };
  } catch (e) {
    Logger.log('Erro em getVoterStatus: ' + e.message);
    throw e;
  }
}

function getVoter(cpf) {
  // Mantém compatibilidade com código antigo (usa BaseDados)
  var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('BaseDados');
  var data = sheet.getDataRange().getValues();
  var target = normalizeCPF_(cpf);
  var found = false;
  var aggregate = {
    cpf: target,
    nome: '',
    apartamento: '',
    torre: '',
    votou: false,
    voto: ''
  };
  for (var i = 1; i < data.length; i++) {
    if (normalizeCPF_(data[i][0]) === target) {
      if (!found) {
        aggregate.nome = data[i][1];
        aggregate.apartamento = data[i][2];
        aggregate.torre = data[i][3];
      }
      found = true;
      if (data[i][4]) {
        aggregate.votou = true;
        aggregate.voto = data[i][4];
      }
    }
  }
  if (!found) {
    throw new Error('CPF não encontrado!');
  }
  return aggregate;
}

function getVoterGeneric(cpf, tipoVotacao) {
  return getVoterStatus(cpf, tipoVotacao);
}

function saveVoteGeneric(cpf, voto, tipoVotacao) {
  try {
    // Valida se o eleitor existe na aba moradores
    var voter = getVoterFromMoradores(cpf);
    
    // Busca a pauta para obter o nome correto da aba
    var pauta = getPautaByAba(tipoVotacao);
    var abaNome = tipoVotacao;
    if (pauta && pauta.aba) {
      abaNome = pauta.aba;
    }
    
    // Valida se a pauta está liberada
    if (pauta && pauta.status !== 'Votação Liberada') {
      throw new Error('Esta votação não está liberada no momento!');
    }
    
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var votacaoSheet = ss.getSheetByName(abaNome);
    
    // Se a aba não existe, cria ela
    if (!votacaoSheet) {
      votacaoSheet = ss.insertSheet(abaNome);
      votacaoSheet.getRange(1, 1, 1, 6).setValues([['CPF', 'Nome', 'Apartamento', 'Torre', 'Voto', 'TimeStamp']]);
      votacaoSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }
    
    var data = votacaoSheet.getDataRange().getValues();
    var target = normalizeCPF_(cpf);
    var rowIndex = -1;
    var anyVoted = false;
    
    // Procura se já existe uma linha para este CPF
    for (var i = 1; i < data.length; i++) {
      if (normalizeCPF_(String(data[i][0] || '')) === target) {
        rowIndex = i + 1; // 1-based
        if (data[i][4]) {
          anyVoted = true;
        }
        break;
      }
    }
    
    if (anyVoted) {
      throw new Error('Voto já registrado para este CPF nesta votação!');
    }
    
    var timestampCol = getHeaderColumnByName_(votacaoSheet, 'TimeStamp') || 6;
    var now = new Date();
    
    if (rowIndex > 0) {
      // Atualiza linha existente
      votacaoSheet.getRange(rowIndex, 5).setValue(voto);
      votacaoSheet.getRange(rowIndex, timestampCol).setValue(now);
    } else {
      // Cria nova linha
      var newRow = [
        voter.cpf,
        voter.nome,
        voter.apartamento,
        voter.torre,
        voto,
        now
      ];
      votacaoSheet.appendRow(newRow);
    }
    
    return { success: true };
  } catch (e) {
    Logger.log('Erro em saveVoteGeneric: ' + e.message);
    throw e;
  }
}

function saveVote(cpf, sindico) {
  // Mantém compatibilidade com código antigo
  var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('BaseDados');
  var data = sheet.getDataRange().getValues();
  
  var target = normalizeCPF_(cpf);
  var rowsToUpdate = [];
  var anyVoted = false;
  for (var i = 1; i < data.length; i++) {
    if (normalizeCPF_(data[i][0]) === target) {
      if (data[i][4]) {
        anyVoted = true;
      } else {
        rowsToUpdate.push(i + 1); // 1-based row index
      }
    }
  }
  if (rowsToUpdate.length === 0 && !anyVoted) {
    throw new Error('CPF não encontrado!');
  }
  if (anyVoted) {
    throw new Error('Voto já registrado para este CPF!');
  }
  // Atualiza todas as linhas correspondentes: voto e timestamp
  var timestampCol = getHeaderColumnByName_(sheet, 'TimeStamp') || 6; // fallback para col F
  var now = new Date();
  rowsToUpdate.forEach(function(rowIndex){
    sheet.getRange(rowIndex, 5).setValue(sindico);
    sheet.getRange(rowIndex, timestampCol).setValue(now);
  });
  return;
}

function getScoresGeneric(tipoVotacao) {
  try {
    // Busca a pauta para obter o nome correto da aba
    var pauta = getPautaByAba(tipoVotacao);
    var abaNome = tipoVotacao;
    if (pauta && pauta.aba) {
      abaNome = pauta.aba;
    }
    
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var sheet = ss.getSheetByName(abaNome);
    if (!sheet) {
      return { counts: {}, total: 0 };
    }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { counts: {}, total: 0 };
    }
    var votesRange = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
    var counts = {};
    var total = 0;
    votesRange.forEach(function(row) {
      var choice = String(row[0] || '').trim();
      if (choice) {
        counts[choice] = (counts[choice] || 0) + 1;
        total++;
      }
    });
    return { counts: counts, total: total };
  } catch (e) {
    Logger.log('Erro em getScoresGeneric: ' + e.message);
    throw e;
  }
}

function getScores() {
  // Mantém compatibilidade com código antigo
  try {
    var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('BaseDados');
    var lastRow = sheet.getLastRow();
    Logger.log('Última linha: ' + lastRow);
    if (lastRow < 2) {
      Logger.log('Nenhum dado encontrado');
      return { counts: {}, total: 0 };
    }
    var votesRange = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
    var counts = {};
    var total = 0;
    votesRange.forEach(function(row) {
      var choice = row[0];
      if (choice) {
        counts[choice] = (counts[choice] || 0) + 1;
        total++;
      }
    });
    Logger.log('Placar: ' + JSON.stringify({ counts: counts, total: total }));
    return { counts: counts, total: total };
  } catch (e) {
    Logger.log('Erro em getScores: ' + e.message);
    throw e;
  }
}

function getWebAppUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (err) {
    return '';
  }
}

// -------- Função genérica para buscar candidatos/opções --------
function getCandidates(tipoVotacao) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    // Tenta buscar da aba específica de candidatos para este tipo
    var sheetName = tipoVotacao + '_candidatos';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Tenta aba genérica "candidatos"
      sheet = ss.getSheetByName('candidatos');
    }
    if (!sheet) {
      // Se não encontrar, retorna array vazio
      return [];
    }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var list = [];
    values.forEach(function(r){ 
      var name = String(r[0] || '').trim(); 
      if (name) list.push(name); 
    });
    return list;
  } catch (e) {
    Logger.log('Erro em getCandidates: ' + e.message);
    return [];
  }
}

// -------- Funções de Pautas --------
function getPautas() {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var pautasSheet = ss.getSheetByName('pautas');
    if (!pautasSheet) {
      return [];
    }
    var data = pautasSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    var pautas = [];
    for (var i = 1; i < data.length; i++) {
      var status = String(data[i][6] || '').trim();
      if (status === 'Votação Liberada') {
        var opcoes = [];
        if (data[i][2]) opcoes.push(String(data[i][2]).trim());
        if (data[i][3]) opcoes.push(String(data[i][3]).trim());
        if (data[i][4]) opcoes.push(String(data[i][4]).trim());
        if (data[i][5]) opcoes.push(String(data[i][5]).trim());
        opcoes = opcoes.filter(function(o) { return o && o !== 'Não Aplica'; });
        
        var aba = String(data[i][7] || '').trim();
        // Se não tiver aba definida, gera automaticamente
        if (!aba) {
          aba = toCamelCase(String(data[i][0] || '').trim());
        }
        
        pautas.push({
          nomePauta: String(data[i][0] || '').trim(),
          descricao: String(data[i][1] || '').trim(),
          opcoes: opcoes,
          status: status,
          aba: aba
        });
      }
    }
    return pautas;
  } catch (e) {
    Logger.log('Erro em getPautas: ' + e.message);
    return [];
  }
}

function getAllPautas() {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var pautasSheet = ss.getSheetByName('pautas');
    if (!pautasSheet) {
      return [];
    }
    var data = pautasSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    var pautas = [];
    for (var i = 1; i < data.length; i++) {
      var opcoes = [];
      if (data[i][2]) opcoes.push(String(data[i][2]).trim());
      if (data[i][3]) opcoes.push(String(data[i][3]).trim());
      if (data[i][4]) opcoes.push(String(data[i][4]).trim());
      if (data[i][5]) opcoes.push(String(data[i][5]).trim());
      opcoes = opcoes.filter(function(o) { return o && o !== 'Não Aplica'; });
      
      var aba = String(data[i][7] || '').trim();
      // Se não tiver aba definida, gera automaticamente
      if (!aba) {
        aba = toCamelCase(String(data[i][0] || '').trim());
      }
      
      pautas.push({
          nomePauta: String(data[i][0] || '').trim(),
          descricao: String(data[i][1] || '').trim(),
          opcao1: String(data[i][2] || '').trim(),
          opcao2: String(data[i][3] || '').trim(),
          opcao3: String(data[i][4] || '').trim(),
          opcao4: String(data[i][5] || '').trim(),
          opcoes: opcoes,
          status: String(data[i][6] || '').trim(),
          aba: aba,
          rowIndex: i + 1
        });
    }
    return pautas;
  } catch (e) {
    Logger.log('Erro em getAllPautas: ' + e.message);
    return [];
  }
}

function getPautaByAba(abaNome) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var pautasSheet = ss.getSheetByName('pautas');
    if (!pautasSheet) {
      return null;
    }
    var data = pautasSheet.getDataRange().getValues();
    var targetAba = abaNome.toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var aba = String(data[i][7] || '').trim();
      // Se não tiver aba definida, gera automaticamente
      if (!aba) {
        aba = toCamelCase(String(data[i][0] || '').trim());
      }
      if (aba.toLowerCase() === targetAba) {
        var opcoes = [];
        if (data[i][2]) opcoes.push(String(data[i][2]).trim());
        if (data[i][3]) opcoes.push(String(data[i][3]).trim());
        if (data[i][4]) opcoes.push(String(data[i][4]).trim());
        if (data[i][5]) opcoes.push(String(data[i][5]).trim());
        opcoes = opcoes.filter(function(o) { return o && o !== 'Não Aplica'; });
        
        return {
          nomePauta: String(data[i][0] || '').trim(),
          descricao: String(data[i][1] || '').trim(),
          opcoes: opcoes,
          status: String(data[i][6] || '').trim(),
          aba: aba
        };
      }
    }
    return null;
  } catch (e) {
    Logger.log('Erro em getPautaByAba: ' + e.message);
    return null;
  }
}

function getVotingConfig(tipoVotacao) {
  try {
    // Primeiro tenta buscar da aba pautas
    var pauta = getPautaByAba(tipoVotacao);
    if (pauta) {
      return {
        titulo: pauta.nomePauta,
        descricao: pauta.descricao,
        candidatos: pauta.opcoes,
        status: pauta.status,
        aba: pauta.aba
      };
    }
    
    // Fallback para config antiga
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var configSheet = ss.getSheetByName('config_votacoes');
    if (!configSheet) {
      // Retorna configuração padrão
      return {
        titulo: tipoVotacao.charAt(0).toUpperCase() + tipoVotacao.slice(1),
        descricao: 'Votação de ' + tipoVotacao,
        candidatos: getCandidates(tipoVotacao)
      };
    }
    var data = configSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim().toLowerCase() === tipoVotacao.toLowerCase()) {
        var candidatos = String(data[i][3] || '').split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c; });
        return {
          titulo: String(data[i][1] || tipoVotacao).trim(),
          descricao: String(data[i][2] || '').trim(),
          candidatos: candidatos.length > 0 ? candidatos : getCandidates(tipoVotacao)
        };
      }
    }
    // Se não encontrou na config, retorna padrão
    return {
      titulo: tipoVotacao.charAt(0).toUpperCase() + tipoVotacao.slice(1),
      descricao: 'Votação de ' + tipoVotacao,
      candidatos: getCandidates(tipoVotacao)
    };
  } catch (e) {
    Logger.log('Erro em getVotingConfig: ' + e.message);
    return {
      titulo: tipoVotacao.charAt(0).toUpperCase() + tipoVotacao.slice(1),
      descricao: 'Votação de ' + tipoVotacao,
      candidatos: []
    };
  }
}

// -------- Subsíndico (aba 'subsindico' e 'candidatos') --------
function getSubCandidates() {
  var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
  var sheet = ss.getSheetByName('candidatos');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var list = [];
  values.forEach(function(r){ var name = String(r[0] || '').trim(); if (name) list.push(name); });
  return list;
}

function getSubVoter(cpf) {
  var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('subsindico');
  var data = sheet.getDataRange().getValues();
  var target = normalizeCPF_(cpf);
  var found = false;
  var aggregate = { cpf: target, nome: '', apartamento: '', torre: '', votou: false, voto: '' };
  for (var i = 1; i < data.length; i++) {
    if (normalizeCPF_(data[i][0]) === target) {
      if (!found) {
        aggregate.nome = data[i][1];
        aggregate.apartamento = data[i][2];
        aggregate.torre = data[i][3];
      }
      found = true;
      if (data[i][4]) {
        aggregate.votou = true;
        aggregate.voto = data[i][4];
      }
    }
  }
  if (!found) throw new Error('CPF não encontrado!');
  return aggregate;
}

function saveSubVote(cpf, candidato) {
  var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('subsindico');
  var data = sheet.getDataRange().getValues();
  var target = normalizeCPF_(cpf);
  var rowsToUpdate = [];
  var anyVoted = false;
  for (var i = 1; i < data.length; i++) {
    if (normalizeCPF_(data[i][0]) === target) {
      if (data[i][4]) { anyVoted = true; }
      else { rowsToUpdate.push(i + 1); }
    }
  }
  if (rowsToUpdate.length === 0 && !anyVoted) throw new Error('CPF não encontrado!');
  if (anyVoted) throw new Error('Voto já registrado para este CPF!');

  var timestampCol = getHeaderColumnByName_(sheet, 'TimeStamp') || 6;
  var now = new Date();
  rowsToUpdate.forEach(function(rowIndex){
    sheet.getRange(rowIndex, 5).setValue(candidato);
    sheet.getRange(rowIndex, timestampCol).setValue(now);
  });
}

function getSubScores() {
  var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('subsindico');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { counts: {}, total: 0 };
  var votesRange = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
  var counts = {}, total = 0;
  votesRange.forEach(function(row){ var c = row[0]; if (c) { counts[c] = (counts[c] || 0) + 1; total++; }});
  return { counts: counts, total: total };
}

// -------- Funções Administrativas --------
function authenticateAdmin(cpf, senha) {
  try {
    var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('administrador');
    if (!sheet) {
      throw new Error('Aba administrador não encontrada!');
    }
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      throw new Error('Nenhum administrador cadastrado!');
    }
    var targetCPF = normalizeCPF_(cpf);
    for (var i = 1; i < data.length; i++) {
      var rowCPF = normalizeCPF_(String(data[i][0] || ''));
      var rowSenha = String(data[i][4] || '').trim();
      var rowAcesso = String(data[i][2] || '').trim().toLowerCase();
      if (rowCPF === targetCPF && rowSenha === senha && rowAcesso === 'administrador') {
        return {
          success: true,
          nome: String(data[i][1] || '').trim(),
          cpf: targetCPF,
          acesso: rowAcesso
        };
      }
    }
    throw new Error('CPF ou senha inválidos!');
  } catch (e) {
    Logger.log('Erro em authenticateAdmin: ' + e.message);
    throw e;
  }
}

function getAllVotes() {
  try {
    var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('BaseDados');
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    var votes = [];
    var timestampCol = getHeaderColumnByName_(sheet, 'TimeStamp') || 6;
    for (var i = 1; i < data.length; i++) {
      if (data[i][4]) { // Se tem voto
        votes.push({
          cpf: normalizeCPF_(String(data[i][0] || '')),
          nome: String(data[i][1] || '').trim(),
          apartamento: String(data[i][2] || '').trim(),
          torre: String(data[i][3] || '').trim(),
          voto: String(data[i][4] || '').trim(),
          timestamp: data[i][timestampCol - 1] ? new Date(data[i][timestampCol - 1]).toLocaleString('pt-BR') : ''
        });
      }
    }
    return votes;
  } catch (e) {
    Logger.log('Erro em getAllVotes: ' + e.message);
    throw e;
  }
}

function getAllSubVotes() {
  try {
    var sheet = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ').getSheetByName('subsindico');
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    var votes = [];
    var timestampCol = getHeaderColumnByName_(sheet, 'TimeStamp') || 6;
    for (var i = 1; i < data.length; i++) {
      if (data[i][4]) { // Se tem voto
        votes.push({
          cpf: normalizeCPF_(String(data[i][0] || '')),
          nome: String(data[i][1] || '').trim(),
          apartamento: String(data[i][2] || '').trim(),
          torre: String(data[i][3] || '').trim(),
          voto: String(data[i][4] || '').trim(),
          timestamp: data[i][timestampCol - 1] ? new Date(data[i][timestampCol - 1]).toLocaleString('pt-BR') : ''
        });
      }
    }
    return votes;
  } catch (e) {
    Logger.log('Erro em getAllSubVotes: ' + e.message);
    throw e;
  }
}

function getAdminStats() {
  try {
    var sindicoScores = getScores();
    var subsindicoScores = getSubScores();
    var allVotes = getAllVotes();
    var allSubVotes = getAllSubVotes();
    return {
      sindico: {
        scores: sindicoScores,
        totalVotes: allVotes.length
      },
      subsindico: {
        scores: subsindicoScores,
        totalVotes: allSubVotes.length
      },
      totalVoters: allVotes.length + allSubVotes.length
    };
  } catch (e) {
    Logger.log('Erro em getAdminStats: ' + e.message);
    throw e;
  }
}

// -------- Funções Administrativas de Pautas --------
function toCamelCase(text) {
  if (!text) return '';
  // Remove caracteres especiais e acentos básicos
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Divide em palavras, converte para minúsculas e capitaliza a primeira letra de cada palavra (exceto a primeira)
  var words = text.trim().split(/\s+/);
  if (words.length === 0) return '';
  var result = words[0].toLowerCase();
  for (var i = 1; i < words.length; i++) {
    var word = words[i].toLowerCase();
    if (word.length > 0) {
      result += word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  // Remove caracteres não alfanuméricos
  result = result.replace(/[^a-zA-Z0-9]/g, '');
  return result;
}

function savePauta(pautaData) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var pautasSheet = ss.getSheetByName('pautas');
    
    if (!pautasSheet) {
      // Cria a aba se não existir
      pautasSheet = ss.insertSheet('pautas');
      pautasSheet.getRange(1, 1, 1, 8).setValues([['nomePauta', 'descricao', 'opcao1', 'opcao2', 'opcao3', 'opcao4', 'status', 'aba']]);
      pautasSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    }
    
    // Gera automaticamente o nome da aba em camelCase a partir do nome da pauta
    var abaNome = toCamelCase(pautaData.nomePauta);
    
    if (pautaData.rowIndex && pautaData.rowIndex > 1) {
      // Atualiza pauta existente
      var row = pautaData.rowIndex;
      pautasSheet.getRange(row, 1).setValue(pautaData.nomePauta);
      pautasSheet.getRange(row, 2).setValue(pautaData.descricao);
      pautasSheet.getRange(row, 3).setValue(pautaData.opcao1 || 'Não Aplica');
      pautasSheet.getRange(row, 4).setValue(pautaData.opcao2 || 'Não Aplica');
      pautasSheet.getRange(row, 5).setValue(pautaData.opcao3 || 'Não Aplica');
      pautasSheet.getRange(row, 6).setValue(pautaData.opcao4 || 'Não Aplica');
      pautasSheet.getRange(row, 7).setValue(pautaData.status || 'Votação Planejada');
      pautasSheet.getRange(row, 8).setValue(abaNome);
    } else {
      // Cria nova pauta
      var newRow = [
        pautaData.nomePauta,
        pautaData.descricao,
        pautaData.opcao1 || 'Não Aplica',
        pautaData.opcao2 || 'Não Aplica',
        pautaData.opcao3 || 'Não Aplica',
        pautaData.opcao4 || 'Não Aplica',
        pautaData.status || 'Votação Planejada',
        abaNome
      ];
      pautasSheet.appendRow(newRow);
    }
    
    return { success: true };
  } catch (e) {
    Logger.log('Erro em savePauta: ' + e.message);
    throw e;
  }
}

function deletePauta(rowIndex) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var pautasSheet = ss.getSheetByName('pautas');
    if (!pautasSheet || rowIndex < 2) {
      throw new Error('Pauta inválida!');
    }
    pautasSheet.deleteRow(rowIndex);
    return { success: true };
  } catch (e) {
    Logger.log('Erro em deletePauta: ' + e.message);
    throw e;
  }
}

function updatePautaStatus(rowIndex, novoStatus) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var pautasSheet = ss.getSheetByName('pautas');
    if (!pautasSheet || rowIndex < 2) {
      throw new Error('Pauta inválida!');
    }
    pautasSheet.getRange(rowIndex, 7).setValue(novoStatus);
    return { success: true };
  } catch (e) {
    Logger.log('Erro em updatePautaStatus: ' + e.message);
    throw e;
  }
}

function getPautaStats(abaNome) {
  try {
    var pauta = getPautaByAba(abaNome);
    if (!pauta) {
      return {
        scores: { counts: {}, total: 0 },
        votes: [],
        totalVotes: 0
      };
    }
    
    var scores = getScoresGeneric(abaNome);
    var votes = getAllVotesByAba(abaNome);
    
    return {
      scores: scores,
      votes: votes,
      totalVotes: votes.length
    };
  } catch (e) {
    Logger.log('Erro em getPautaStats: ' + e.message);
    throw e;
  }
}

// -------- Funções de Gerenciamento de Moradores --------
function getAllMoradores() {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var moradoresSheet = ss.getSheetByName('moradores');
    if (!moradoresSheet) {
      return [];
    }
    var data = moradoresSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    var moradores = [];
    for (var i = 1; i < data.length; i++) {
      moradores.push({
        cpf: normalizeCPF_(String(data[i][0] || '')),
        nome: String(data[i][1] || '').trim(),
        apartamento: String(data[i][2] || '').trim(),
        torre: String(data[i][3] || '').trim(),
        rowIndex: i + 1
      });
    }
    return moradores;
  } catch (e) {
    Logger.log('Erro em getAllMoradores: ' + e.message);
    throw e;
  }
}

function processExcelUpload(base64Data, fileName) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var moradoresSheet = ss.getSheetByName('moradores');
    
    if (!moradoresSheet) {
      moradoresSheet = ss.insertSheet('moradores');
      moradoresSheet.getRange(1, 1, 1, 4).setValues([['CPF', 'Nome', 'Apartamento', 'Torre']]);
      moradoresSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    
    // Converte base64 para blob
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    
    // Tenta usar Drive API primeiro (pode ter permissões diferentes)
    var fileId = null;
    var importedSS = null;
    
    try {
      // Tenta usar Drive API para criar arquivo com conversão automática
      var resource = {
        title: 'Temp_Import_' + new Date().getTime(),
        mimeType: MimeType.GOOGLE_SHEETS
      };
      var file = Drive.Files.insert(resource, blob, {
        convert: true
      });
      fileId = file.id;
      importedSS = SpreadsheetApp.openById(fileId);
    } catch (e1) {
      // Se Drive API falhar, tenta DriveApp
      try {
        var tempFile = DriveApp.createFile(blob);
        fileId = tempFile.getId();
        
        // Aguarda conversão (pode levar alguns segundos)
        Utilities.sleep(2000);
        importedSS = SpreadsheetApp.openById(fileId);
      } catch (e2) {
        // Se ainda falhar, tenta aguardar mais e tentar novamente
        if (fileId) {
          Utilities.sleep(3000);
          try {
            importedSS = SpreadsheetApp.openById(fileId);
          } catch (e3) {
            // Limpa arquivo temporário se criado
            try {
              if (fileId) {
                var fileToDelete = DriveApp.getFileById(fileId);
                fileToDelete.setTrashed(true);
              }
            } catch (e4) {}
            throw new Error('Não foi possível processar o arquivo Excel. Por favor, verifique se você autorizou o acesso ao Google Drive. Se necessário, execute o script manualmente uma vez no editor para conceder as permissões necessárias.');
          }
        } else {
          throw new Error('Erro ao processar arquivo: É necessário autorizar o acesso ao Google Drive. Por favor, execute o script manualmente uma vez no editor do Google Apps Script para conceder as permissões necessárias.');
        }
      }
    }
    
    if (!importedSS) {
      throw new Error('Não foi possível abrir o arquivo Excel.');
    }
    
    var importedSheet = importedSS.getSheets()[0];
    
    // Copia dados da planilha importada
    var importedData = importedSheet.getDataRange().getValues();
    if (importedData.length < 2) {
      try {
        DriveApp.getFileById(importedSS.getId()).setTrashed(true);
      } catch (e) {}
      throw new Error('Planilha vazia ou sem dados!');
    }
    
    // Encontra índices das colunas
    var header = importedData[0];
    var cpfCol = -1, nomeCol = -1, aptoCol = -1, torreCol = -1;
    for (var i = 0; i < header.length; i++) {
      var h = String(header[i] || '').trim().toLowerCase();
      if (h === 'cpf' && cpfCol === -1) cpfCol = i;
      if ((h === 'nome' || h === 'name') && nomeCol === -1) nomeCol = i;
      if ((h === 'apartamento' || h === 'apto' || h === 'apart') && aptoCol === -1) aptoCol = i;
      if ((h === 'torre' || h === 'tower') && torreCol === -1) torreCol = i;
    }
    
    if (aptoCol === -1 || torreCol === -1) {
      try {
        DriveApp.getFileById(importedSS.getId()).setTrashed(true);
      } catch (e) {}
      throw new Error('Colunas obrigatórias não encontradas: Apartamento e Torre são necessárias!');
    }
    
    // Lê dados existentes da aba moradores
    var existingData = moradoresSheet.getDataRange().getValues();
    var existingMap = {}; // Mapa por Apartamento+Torre
    for (var i = 1; i < existingData.length; i++) {
      var key = String(existingData[i][2] || '').trim() + '|' + String(existingData[i][3] || '').trim();
      existingMap[key] = i + 1; // row index
    }
    
    var inserted = 0;
    var updated = 0;
    
    // Processa cada linha do arquivo importado
    for (var i = 1; i < importedData.length; i++) {
      var row = importedData[i];
      var apartamento = String(row[aptoCol] || '').trim();
      var torre = String(row[torreCol] || '').trim();
      
      if (!apartamento || !torre) continue; // Pula linhas sem chave
      
      var key = apartamento + '|' + torre;
      var cpf = cpfCol >= 0 ? normalizeCPF_(String(row[cpfCol] || '')) : '';
      var nome = nomeCol >= 0 ? String(row[nomeCol] || '').trim() : '';
      
      if (existingMap[key]) {
        // Atualiza registro existente
        var rowIndex = existingMap[key];
        if (cpf) moradoresSheet.getRange(rowIndex, 1).setValue(cpf);
        if (nome) moradoresSheet.getRange(rowIndex, 2).setValue(nome);
        moradoresSheet.getRange(rowIndex, 3).setValue(apartamento);
        moradoresSheet.getRange(rowIndex, 4).setValue(torre);
        updated++;
      } else {
        // Insere novo registro
        moradoresSheet.appendRow([cpf || '', nome || '', apartamento, torre]);
        existingMap[key] = moradoresSheet.getLastRow();
        inserted++;
      }
    }
    
    // Remove arquivo temporário
    try {
      DriveApp.getFileById(fileId).setTrashed(true);
    } catch (e) {
      Logger.log('Erro ao remover arquivo temporário: ' + e.message);
    }
    
    return {
      success: true,
      inserted: inserted,
      updated: updated,
      total: inserted + updated
    };
  } catch (e) {
    Logger.log('Erro em processExcelUpload: ' + e.message);
    throw e;
  }
}

function deleteMorador(rowIndex) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var moradoresSheet = ss.getSheetByName('moradores');
    if (!moradoresSheet || rowIndex < 2) {
      throw new Error('Morador inválido!');
    }
    moradoresSheet.deleteRow(rowIndex);
    return { success: true };
  } catch (e) {
    Logger.log('Erro em deleteMorador: ' + e.message);
    throw e;
  }
}

function getAllVotesByAba(abaNome) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var sheet = ss.getSheetByName(abaNome);
    if (!sheet) {
      return [];
    }
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    var votes = [];
    var timestampCol = getHeaderColumnByName_(sheet, 'TimeStamp') || 6;
    for (var i = 1; i < data.length; i++) {
      if (data[i][4]) { // Se tem voto
        votes.push({
          cpf: normalizeCPF_(String(data[i][0] || '')),
          nome: String(data[i][1] || '').trim(),
          apartamento: String(data[i][2] || '').trim(),
          torre: String(data[i][3] || '').trim(),
          voto: String(data[i][4] || '').trim(),
          timestamp: data[i][timestampCol - 1] ? new Date(data[i][timestampCol - 1]).toLocaleString('pt-BR') : ''
        });
      }
    }
    return votes;
  } catch (e) {
    Logger.log('Erro em getAllVotesByAba: ' + e.message);
    throw e;
  }
}

function exportPautaToExcel(abaNome) {
  try {
    var pauta = getPautaByAba(abaNome);
    if (!pauta) {
      throw new Error('Pauta não encontrada!');
    }
    
    var votes = getAllVotesByAba(abaNome);
    
    // Cria uma nova planilha Google Sheets
    var newSS = SpreadsheetApp.create('Relatorio_Votacao_' + pauta.nomePauta.replace(/\s+/g, '_') + '_' + new Date().getTime());
    var sheet = newSS.getActiveSheet();
    sheet.setName('Votos');
    
    // Título
    sheet.getRange(1, 1).setValue('Relatório de Votação: ' + pauta.nomePauta);
    sheet.getRange(1, 1, 1, 6).merge();
    sheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
    
    // Informações da pauta
    sheet.getRange(3, 1).setValue('Descrição:');
    sheet.getRange(3, 2).setValue(pauta.descricao);
    sheet.getRange(4, 1).setValue('Status:');
    sheet.getRange(4, 2).setValue(pauta.status);
    sheet.getRange(5, 1).setValue('Data de Exportação:');
    sheet.getRange(5, 2).setValue(new Date().toLocaleString('pt-BR'));
    
    // Cabeçalho da tabela
    var headerRow = 7;
    sheet.getRange(headerRow, 1, 1, 6).setValues([['CPF', 'Nome', 'Apartamento', 'Torre', 'Voto', 'Data/Hora']]);
    sheet.getRange(headerRow, 1, 1, 6).setFontWeight('bold');
    sheet.getRange(headerRow, 1, 1, 6).setBackground('#f3f4f6');
    
    // Dados
    if (votes.length > 0) {
      var data = votes.map(function(v) {
        return [v.cpf, v.nome, v.apartamento, v.torre, v.voto, v.timestamp];
      });
      sheet.getRange(headerRow + 1, 1, data.length, 6).setValues(data);
    }
    
    // Formatação
    sheet.autoResizeColumns(1, 6);
    sheet.setFrozenRows(headerRow);
    
    // Torna a planilha pública para download
    newSS.addEditor(Session.getActiveUser().getEmail());
    
    var url = newSS.getUrl();
    return { url: url, fileName: newSS.getName() };
  } catch (e) {
    Logger.log('Erro em exportPautaToExcel: ' + e.message);
    throw e;
  }
}

function exportPautaToPDF(abaNome) {
  try {
    var pauta = getPautaByAba(abaNome);
    if (!pauta) {
      throw new Error('Pauta não encontrada!');
    }
    
    var votes = getAllVotesByAba(abaNome);
    
    // Cria uma nova planilha temporária para exportação
    var tempSS = SpreadsheetApp.create('Temp_Export_' + new Date().getTime());
    var sheet = tempSS.getActiveSheet();
    
    // Título
    sheet.getRange(1, 1).setValue('Relatório de Votação: ' + pauta.nomePauta);
    sheet.getRange(1, 1, 1, 6).merge();
    sheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
    
    // Informações da pauta
    sheet.getRange(3, 1).setValue('Descrição:');
    sheet.getRange(3, 2).setValue(pauta.descricao);
    sheet.getRange(4, 1).setValue('Status:');
    sheet.getRange(4, 2).setValue(pauta.status);
    sheet.getRange(5, 1).setValue('Data de Exportação:');
    sheet.getRange(5, 2).setValue(new Date().toLocaleString('pt-BR'));
    
    // Cabeçalho da tabela
    var headerRow = 7;
    sheet.getRange(headerRow, 1, 1, 6).setValues([['CPF', 'Nome', 'Apartamento', 'Torre', 'Voto', 'Data/Hora']]);
    sheet.getRange(headerRow, 1, 1, 6).setFontWeight('bold');
    sheet.getRange(headerRow, 1, 1, 6).setBackground('#f3f4f6');
    
    // Dados
    if (votes.length > 0) {
      var data = votes.map(function(v) {
        return [v.cpf, v.nome, v.apartamento, v.torre, v.voto, v.timestamp];
      });
      sheet.getRange(headerRow + 1, 1, data.length, 6).setValues(data);
    }
    
    // Formatação
    sheet.autoResizeColumns(1, 6);
    
    // Gera PDF
    var blob = tempSS.getAs('application/pdf');
    var fileName = 'Relatorio_Votacao_' + pauta.nomePauta.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().getTime() + '.pdf';
    var file = DriveApp.createFile(blob);
    file.setName(fileName);
    
    // Remove a planilha temporária
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);
    
    return { url: file.getUrl(), fileName: fileName };
  } catch (e) {
    Logger.log('Erro em exportPautaToPDF: ' + e.message);
    throw e;
  }
}

function getVotesByPauta(abaNome) {
  try {
    var ss = SpreadsheetApp.openById('1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ');
    var sheet = ss.getSheetByName(abaNome);
    if (!sheet) {
      return [];
    }
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    var votes = [];
    var timestampCol = getHeaderColumnByName_(sheet, 'TimeStamp') || 6;
    for (var i = 1; i < data.length; i++) {
      if (data[i][4]) { // Se tem voto
        votes.push({
          cpf: normalizeCPF_(String(data[i][0] || '')),
          nome: String(data[i][1] || '').trim(),
          apartamento: String(data[i][2] || '').trim(),
          torre: String(data[i][3] || '').trim(),
          voto: String(data[i][4] || '').trim(),
          timestamp: data[i][timestampCol - 1] ? new Date(data[i][timestampCol - 1]).toLocaleString('pt-BR') : ''
        });
      }
    }
    return votes;
  } catch (e) {
    Logger.log('Erro em getVotesByPauta: ' + e.message);
    throw e;
  }
}

function getPautaStats(abaNome) {
  try {
    var scores = getScoresGeneric(abaNome);
    var votes = getVotesByPauta(abaNome);
    return {
      scores: scores,
      totalVotes: votes.length,
      votes: votes
    };
  } catch (e) {
    Logger.log('Erro em getPautaStats: ' + e.message);
    throw e;
  }
}

function exportVotesToExcel(abaNome) {
  try {
    var votes = getVotesByPauta(abaNome);
    var pauta = getPautaByAba(abaNome);
    var pautaNome = pauta ? pauta.nomePauta : abaNome;
    
    // Cria um novo spreadsheet temporário
    var ss = SpreadsheetApp.create('Votos_' + pautaNome + '_' + new Date().getTime());
    var sheet = ss.getActiveSheet();
    
    // Cabeçalhos
    sheet.getRange(1, 1, 1, 6).setValues([['CPF', 'Nome', 'Apartamento', 'Torre', 'Voto', 'Data/Hora']]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    
    // Dados
    if (votes.length > 0) {
      var data = votes.map(function(v) {
        return [v.cpf, v.nome, v.apartamento, v.torre, v.voto, v.timestamp];
      });
      sheet.getRange(2, 1, data.length, 6).setValues(data);
    }
    
    // Ajusta largura das colunas
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 100);
    sheet.setColumnWidth(5, 150);
    sheet.setColumnWidth(6, 200);
    
    // Retorna URL do arquivo
    return {
      url: ss.getUrl(),
      id: ss.getId()
    };
  } catch (e) {
    Logger.log('Erro em exportVotesToExcel: ' + e.message);
    throw e;
  }
}

function exportVotesToPDF(abaNome) {
  try {
    var votes = getVotesByPauta(abaNome);
    var pauta = getPautaByAba(abaNome);
    var pautaNome = pauta ? pauta.nomePauta : abaNome;
    
    // Cria um novo spreadsheet temporário
    var ss = SpreadsheetApp.create('Votos_' + pautaNome + '_' + new Date().getTime());
    var sheet = ss.getActiveSheet();
    
    // Cabeçalhos
    sheet.getRange(1, 1, 1, 6).setValues([['CPF', 'Nome', 'Apartamento', 'Torre', 'Voto', 'Data/Hora']]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    
    // Dados
    if (votes.length > 0) {
      var data = votes.map(function(v) {
        return [v.cpf, v.nome, v.apartamento, v.torre, v.voto, v.timestamp];
      });
      sheet.getRange(2, 1, data.length, 6).setValues(data);
    }
    
    // Ajusta largura das colunas
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 100);
    sheet.setColumnWidth(5, 150);
    sheet.setColumnWidth(6, 200);
    
    // Gera PDF usando a URL de exportação do Google Sheets
    var pdfUrl = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf&size=A4&portrait=true&fitw=true';
    
    return {
      url: pdfUrl,
      id: ss.getId(),
      spreadsheetUrl: ss.getUrl()
    };
  } catch (e) {
    Logger.log('Erro em exportVotesToPDF: ' + e.message);
    throw e;
  }
}