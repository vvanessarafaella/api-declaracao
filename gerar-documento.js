export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const dados = req.body;
    
    // Validar dados obrigatórios
    const camposObrigatorios = ['nome', 'cpf', 'email', 'acomodacao'];
    for (let campo of camposObrigatorios) {
      if (!dados[campo]) {
        console.log(`Campo ausente: ${campo}`, dados);
        return res.status(400).json({ error: `Campo obrigatório ausente: ${campo}` });
      }
    }
    
    // Limpar e formatar dados
    const dadosLimpos = {
      nome: String(dados.nome || '').trim(),
      rg: String(dados.rg || '').trim(),
      cpf: String(dados.cpf || '').replace(/\D/g, ''),
      email: String(dados.email || '').trim().toLowerCase(),
      acomodacao: String(dados.acomodacao || '').trim(),
      checkin: dados.checkin || '',
      checkout: dados.checkout || '',
      numHospedes: dados.numHospedes || '1',
      telefone: dados.telefone || '',
      assinatura: dados.assinatura || 'Confirmada digitalmente'
    };
    
    // Gerar documento HTML
    const documentoHTML = gerarDocumentoHTML(dadosLimpos);
    
    // Resposta para o Make.com
    res.json({
      success: true,
      html_content: documentoHTML,
      filename: `Declaracao_${dadosLimpos.nome.replace(/\s+/g, '_')}_${Date.now()}.html`,
      data_geracao: new Date().toISOString(),
      hospede: dadosLimpos.nome,
      acomodacao: dadosLimpos.acomodacao
    });
    
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function gerarDocumentoHTML(dados) {
  // Calcular diárias se houver datas
  let diarias = 1;
  if (dados.checkin && dados.checkout) {
    try {
      const dataCheckin = new Date(dados.checkin);
      const dataCheckout = new Date(dados.checkout);
      diarias = Math.ceil((dataCheckout - dataCheckin) / (1000 * 60 * 60 * 24));
      diarias = diarias > 0 ? diarias : 1;
    } catch (e) {
      diarias = 1;
    }
  }
  
  // Formatar CPF
  const cpfFormatado = dados.cpf.length >= 11 ? 
    dados.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 
    dados.cpf;
  
  // Data atual
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Declaração de Responsabilidade - ${dados.nome}</title>
        <style>
            body { 
                font-family: 'Times New Roman', serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 40px 20px; 
                line-height: 1.6; 
                color: #333; 
            }
            .header { 
                text-align: center; 
                margin-bottom: 40px; 
                border-bottom: 2px solid #2c3e50; 
                padding-bottom: 20px; 
            }
            .header h1 { 
                font-size: 18px; 
                font-weight: bold; 
                margin: 0; 
                text-transform: uppercase; 
                letter-spacing: 1px; 
            }
            .documento-info { 
                background: #f8f9fa; 
                padding: 20px; 
                border-left: 4px solid #3498db; 
                margin: 30px 0; 
                border-radius: 0 5px 5px 0; 
            }
            .dados-hospede { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin: 20px 0; 
            }
            .campo { 
                padding: 10px; 
                border: 1px solid #ddd; 
                border-radius: 3px; 
                background: #fafafa; 
            }
            .campo strong { 
                display: block; 
                color: #2c3e50; 
                font-size: 12px; 
                margin-bottom: 5px; 
            }
            .reserva-info { 
                background: #e8f5e8; 
                padding: 20px; 
                border-radius: 5px; 
                margin: 25px 0; 
                border: 1px solid #27ae60; 
            }
            .clausula { 
                margin: 15px 0; 
                padding: 15px; 
                background: #fdfdfd; 
                border-left: 3px solid #e74c3c; 
            }
            .assinatura-section { 
                background: #f4f4f4; 
                padding: 25px; 
                border-radius: 5px; 
                margin-top: 40px; 
                border: 2px solid #34495e; 
            }
            .assinatura-digital { 
                text-align: center; 
                margin: 20px 0; 
                padding: 15px; 
                background: #fff; 
                border: 2px dashed #3498db; 
                border-radius: 5px; 
            }
            .aviso-importante { 
                background: #fff3cd; 
                border: 1px solid #ffeaa7; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 5px; 
                border-left: 4px solid #f39c12; 
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Declaração de Responsabilidade e Ciência das Regras de Hospedagem</h1>
        </div>

        <div class="documento-info">
            <p><strong>DOCUMENTO OFICIAL DE ACEITE DE TERMOS E CONDIÇÕES</strong></p>
            <p>Este documento comprova a ciência e concordância do hóspede com todas as regras e políticas da acomodação contratada.</p>
        </div>

        <div class="dados-hospede">
            <div class="campo">
                <strong>HÓSPEDE RESPONSÁVEL</strong>
                ${dados.nome}
            </div>
            <div class="campo">
                <strong>DOCUMENTO DE IDENTIDADE</strong>
                ${dados.rg ? `RG nº ${dados.rg}` : 'Não informado'}
            </div>
            <div class="campo">
                <strong>CPF</strong>
                ${cpfFormatado}
            </div>
            <div class="campo">
                <strong>NÚMERO DE HÓSPEDES</strong>
                ${dados.numHospedes} pessoa(s)
            </div>
        </div>

        <div class="reserva-info">
            <h3 style="margin-top: 0; color: #27ae60;">📍 INFORMAÇÕES DA RESERVA</h3>
            <p><strong>Acomodação:</strong> ${dados.acomodacao}</p>
            ${dados.checkin ? `<p><strong>Check-in:</strong> ${formatarData(dados.checkin)} | <strong>Check-out:</strong> ${formatarData(dados.checkout)}</p>` : ''}
            <p><strong>Período:</strong> ${diarias} diária(s)</p>
            ${dados.telefone ? `<p><strong>Contato:</strong> ${dados.telefone}</p>` : ''}
        </div>

        <div style="margin: 30px 0;">
            <h3 style="color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 10px;">DECLARAÇÃO DE CIÊNCIA E CONCORDÂNCIA</h3>
            
            <p>Eu, <strong>${dados.nome}</strong>, na qualidade de hóspede responsável pela reserva acima identificada, <strong>DECLARO</strong> estar plenamente ciente e de acordo com as seguintes condições:</p>

            <div class="clausula">
                <strong>I. POLÍTICA DE VISITAS:</strong> Não é permitido o recebimento de visitas externas durante todo o período da estadia, sendo esta uma norma inviolável do estabelecimento.
            </div>

            <div class="clausula">
                <strong>II. POLÍTICA DE EVENTOS:</strong> A acomodação não pode ser utilizada para festas, eventos, comemorações ou quaisquer atividades não previamente autorizadas por escrito pela administração.
            </div>

            <div class="clausula">
                <strong>III. RESPONSABILIDADE POR DANOS:</strong> Assumo total responsabilidade por qualquer dano causado à acomodação, móveis, equipamentos ou itens durante a estadia, estando sujeito(a) à cobrança integral de reparo ou reposição.
            </div>

            <div class="clausula">
                <strong>IV. POLÍTICAS GERAIS:</strong> Declaro ter lido, compreendido e concordado integralmente com as Políticas de Privacidade, Políticas de Hospedagem e Políticas de Danos da acomodação.
            </div>
        </div>

        <div class="aviso-importante">
            <p><strong>⚠️ IMPORTANTE:</strong> O descumprimento de qualquer uma das regras aqui declaradas poderá resultar em:</p>
            <ul>
                <li>Aplicação de penalidades financeiras</li>
                <li>Advertência formal registrada</li>
                <li>Encerramento antecipado da estadia sem direito a reembolso</li>
                <li>Cobrança de taxas adicionais conforme danos causados</li>
            </ul>
        </div>

        <div class="assinatura-section">
            <h4 style="margin-top: 0; color: #2c3e50;">CONFIRMAÇÃO E ASSINATURA DIGITAL</h4>
            <p>Ao preencher e enviar a Ficha Nacional de Registro de Hóspedes, confirmo que li, compreendi e aceito integralmente todos os termos e condições aqui estabelecidos.</p>
            
            <div class="assinatura-digital">
                <p><strong>ASSINATURA DIGITAL CONFIRMADA</strong></p>
                <p style="font-size: 18px; color: #2c3e50; margin: 10px 0;">${dados.nome}</p>
                <p style="font-size: 12px; color: #666;">Documento assinado digitalmente em ${dataAtual}</p>
            </div>
        </div>

        <div style="text-align: right; margin-top: 30px; font-size: 14px; color: #666;">
            <p><strong>Documento gerado em:</strong> ${dataAtual}</p>
            ${dados.checkin && dados.checkout ? 
              `<p><strong>Válido para o período:</strong> ${formatarData(dados.checkin)} a ${formatarData(dados.checkout)}</p>` : 
              ''
            }
        </div>

        <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #bdc3c7; text-align: center; font-size: 12px; color: #666;">
            Este documento foi gerado automaticamente pelo sistema de gestão de hospedagem e possui validade legal.
        </footer>
    </body>
    </html>
  `;
}

function formatarData(data) {
  try {
    // Tentar diferentes formatos de data
    const date = new Date(data);
    if (isNaN(date.getTime())) {
      return data; // Retorna original se não conseguir converter
    }
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return data;
  }
}