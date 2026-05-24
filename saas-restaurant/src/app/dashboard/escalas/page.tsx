'use client';

import { useState, useEffect } from 'react';
import { generateSchedule, getSchedule, updateScheduleObservation } from '@/lib/services/escala-service';
import { Button, Card, Badge } from '@/components/ui';

interface ScheduleEntry {
  id: string;
  date: string;
  employee_name: string;
  sector: string;
  shift: string;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  observation: string;
}

interface Employee {
  id: string;
  name: string;
  sector: string;
  shift: string;
}

export default function EscalasPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingObservation, setEditingObservation] = useState<{id: string, value: string} | null>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadSchedule();
  }, [currentMonth, currentYear]);

  async function loadSchedule() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedule(currentMonth, currentYear);
      setSchedule(data || []);
    } catch (err) {
      setError('Erro ao carregar escala. Verifique se há funcionários cadastrados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSchedule() {
    if (!confirm(`Deseja gerar a escala automática para ${monthNames[currentMonth - 1]} de ${currentYear}?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await generateSchedule(currentMonth, currentYear);
      setSuccess(`Escala gerada com sucesso! ${result.count} lançamentos criados.`);
      await loadSchedule();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar escala');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveObservation(assignmentId: string, observation: string) {
    try {
      await updateScheduleObservation(assignmentId, observation);
      setSuccess('Observação atualizada com sucesso!');
      setEditingObservation(null);
      await loadSchedule();
    } catch (err: any) {
      setError('Erro ao atualizar observação');
    } finally {
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  function handlePrevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  // Agrupar escala por data e funcionário
  const scheduleByDate = schedule.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ScheduleEntry[]>);

  // Obter dias únicos ordenados
  const uniqueDates = Object.keys(scheduleByDate).sort();

  // Obter funcionários únicos
  const uniqueEmployees = Array.from(new Set(schedule.map(s => s.employee_name))).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Escalas de Trabalho</h2>
        
        <div className="flex items-center gap-4">
          <Button onClick={handlePrevMonth} variant="secondary">
            ← Mês Anterior
          </Button>
          
          <span className="text-lg font-semibold min-w-[200px] text-center">
            {monthNames[currentMonth - 1]} de {currentYear}
          </span>
          
          <Button onClick={handleNextMonth} variant="secondary">
            Próximo Mês →
          </Button>
          
          <Button onClick={handleGenerateSchedule} disabled={loading}>
            Gerar Escala Automática
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {loading && !schedule.length && (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando escala...</p>
        </div>
      )}

      {!loading && schedule.length === 0 && (
        <Card title="Nenhuma escala encontrada">
          <p className="text-gray-600 mb-4">
            Não há escalas cadastradas para este período. Clique em "Gerar Escala Automática" 
            para criar uma nova escala baseada nas regras configuradas.
          </p>
        </Card>
      )}

      {schedule.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uniqueDates.map(date => {
                  const dayEntries = scheduleByDate[date];
                  const dateObj = new Date(date + 'T12:00:00');
                  const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                  
                  return dayEntries.map((entry, idx) => (
                    <tr key={entry.id} className={idx === 0 ? 'border-t-2 border-gray-300' : ''}>
                      {idx === 0 && (
                        <td 
                          rowSpan={dayEntries.length} 
                          className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white"
                        >
                          {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          <div className="text-xs text-gray-500 capitalize">{dayOfWeek}</div>
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {entry.employee_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {entry.sector}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {entry.shift}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {entry.start_time} às {entry.end_time}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entry.is_day_off ? (
                          <Badge variant="warning">Folga</Badge>
                        ) : (
                          <Badge variant="success">Trabalho</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingObservation?.id === entry.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingObservation.value}
                              onChange={(e) => setEditingObservation({ id: entry.id, value: e.target.value })}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              autoFocus
                            />
                            <Button 
                              onClick={() => handleSaveObservation(entry.id, editingObservation.value)}
                              variant="primary"
                              className="px-2 py-1 text-xs"
                            >
                              Salvar
                            </Button>
                            <Button 
                              onClick={() => setEditingObservation(null)}
                              variant="secondary"
                              className="px-2 py-1 text-xs"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() => setEditingObservation({ id: entry.id, value: entry.observation || '' })}
                          >
                            {entry.observation || (
                              <span className="text-gray-400 italic">Clique para adicionar...</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        <h3 className="font-semibold text-gray-700">Legenda:</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="success">Trabalho</Badge>
            <span>Funcionário em turno normal</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Folga</Badge>
            <span>Funcionário de folga (Segunda-feira ou Domingo rotativo)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
