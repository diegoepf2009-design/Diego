import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { Car, Settings, HelpCircle, Sparkles, TrendingUp, DollarSign } from 'lucide-react';

interface VehicleProps {
  configs: SystemConfig[];
  onSaveConfig: (config: SystemConfig) => Promise<void>;
}

export default function Vehicle({ configs, onSaveConfig }: VehicleProps) {
  const carConfig = configs.find(c => c.id === 'car') || {
    id: 'car',
    model: 'HB20 S 2023',
    quitTodayValue: 15600,
    totalInstallments: 48,
    paidInstallments: 20,
    installmentValue: 1200
  };

  // Local Form States
  const [model, setModel] = useState(carConfig.model);
  const [quitTodayValue, setQuitTodayValue] = useState(String(carConfig.quitTodayValue));
  const [totalInstallments, setTotalInstallments] = useState(String(carConfig.totalInstallments || 48));
  const [paidInstallments, setPaidInstallments] = useState(String(carConfig.paidInstallments || 20));
  const [installmentValue, setInstallmentValue] = useState(String(carConfig.installmentValue || 1200));
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculations
  const total = parseInt(totalInstallments) || 0;
  const paid = parseInt(paidInstallments) || 0;
  const remaining = Math.max(0, total - paid);
  const instVal = parseFloat(installmentValue) || 0;
  const quitVal = parseFloat(quitTodayValue) || 0;

  const totalContractVal = total * instVal;
  const totalPaidVal = paid * instVal;
  const remainingContractVal = remaining * instVal;
  const economy = remainingContractVal - quitVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!model.trim()) {
      setErrorMsg('Por favor, informe o Modelo/Ano do Veículo.');
      return;
    }

    const quitValParsed = parseFloat(quitTodayValue);
    const totalInstParsed = parseInt(totalInstallments);
    const paidInstParsed = parseInt(paidInstallments);
    const instValParsed = parseFloat(installmentValue);

    if (isNaN(quitValParsed) || quitValParsed < 0) {
      setErrorMsg('Valor para quitação inválido.');
      return;
    }
    if (isNaN(totalInstParsed) || totalInstParsed <= 0) {
      setErrorMsg('Total de parcelas deve ser maior que zero.');
      return;
    }
    if (isNaN(paidInstParsed) || paidInstParsed < 0 || paidInstParsed > totalInstParsed) {
      setErrorMsg('Parcelas pagas inválidas.');
      return;
    }
    if (isNaN(instValParsed) || instValParsed <= 0) {
      setErrorMsg('Valor da parcela inválido.');
      return;
    }

    const payload: SystemConfig = {
      id: 'car',
      model: model.trim(),
      quitTodayValue: quitValParsed,
      totalInstallments: totalInstParsed,
      paidInstallments: paidInstParsed,
      installmentValue: instValParsed
    };

    try {
      await onSaveConfig(payload);
      setSuccessMsg('Configurações do veículo atualizadas com sucesso!');
    } catch (err) {
      setErrorMsg('Erro ao salvar configurações.');
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 animate-fade-in" id="vehicle-view">
      {/* Parameters Panel */}
      <section className="lg:col-span-2 space-y-6">
        
        {/* Financing KPI metrics */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shadow-inner">
              <Car size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-100">{carConfig.model}</h2>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Acompanhamento do Financiamento Veicular</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Parcelas Pagas</span>
              <span className="text-xl font-bold font-display text-emerald-400">{paid}</span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">de {total}</span>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Parcelas Restam</span>
              <span className="text-xl font-bold font-display text-amber-500">{remaining}</span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">parcelas</span>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Total Pago</span>
              <span className="text-sm font-bold font-mono text-emerald-400 block pt-1.5">{formatBRL(totalPaidVal)}</span>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Saldo Devedor</span>
              <span className="text-sm font-bold font-mono text-red-400 block pt-1.5">{formatBRL(remainingContractVal)}</span>
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">Amortização do Contrato</span>
              <span className="font-bold text-slate-200 font-mono">{total > 0 ? ((paid / total) * 100).toFixed(1) : '0'}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Intelligence / Savings Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-cyan-400 animate-pulse" />
            <span>Simulador de Quitação Antecipada</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">Valor Estimado de Quitação Hoje</span>
              <span className="text-xl font-extrabold font-mono text-slate-100 block">{formatBRL(quitVal)}</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Este é o saldo cobrado pelo banco para liquidar todo o contrato hoje.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-tr from-cyan-950/20 to-indigo-950/20 border border-cyan-500/10 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-cyan-300 font-bold uppercase block">Economia se Quitar Hoje</span>
                <span className={`text-2xl font-extrabold font-mono block ${economy > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {formatBRL(Math.max(0, economy))}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {economy > 0 
                  ? `💡 Ao quitar hoje, você economiza ${formatBRL(economy)} em juros futuros embutidos no contrato!`
                  : '🚗 Não há economia detectada com amortização total sob os valores informados.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/25 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
            <h4 className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <HelpCircle size={13} className="text-slate-400" />
              <span>Como funciona?</span>
            </h4>
            Diferente das parcelas normais, a amortização amortiza de trás para frente, eliminando os juros compostos embutidos. Cada amortização representa uma economia líquida de juros extraordinária para o seu patrimônio.
          </div>
        </div>

      </section>

      {/* Configuration Form */}
      <section className="lg:col-span-1">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
              <Settings size={15} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">Configure seu Financiamento</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Modelo / Ano */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Modelo / Ano do Veículo</label>
              <input
                id="vehicle-model-input"
                type="text"
                placeholder="Ex: HB20 S 2023"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              />
            </div>

            {/* Valor para quitação */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor para Quitação Hoje (R$)</label>
              <input
                id="vehicle-quitation-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quitTodayValue}
                onChange={(e) => setQuitTodayValue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Valor da Parcela */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor da Parcela (R$)</label>
              <input
                id="vehicle-installment-value-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={installmentValue}
                onChange={(e) => setInstallmentValue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Parcelas Totais */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Total de Parcelas do Contrato</label>
              <input
                id="vehicle-installments-total-input"
                type="number"
                placeholder="48"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Parcelas Pagas */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Parcelas Pagas até Hoje</label>
              <input
                id="vehicle-installments-paid-input"
                type="number"
                placeholder="20"
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            <button
              type="submit"
              id="vehicle-submit-btn"
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <TrendingUp size={14} />
              <span>Calcular Parâmetros</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
