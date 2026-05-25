'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getSchedule as fetchScales,
  generateSchedule as generateSchedules,
  updateScheduleObservation as updateSchedule,
  ScaleData,
  ScheduleItem
} from '@/lib/services/escala-service';
import ScaleMatrix from '@/components/dashboard/ScaleMatrix';
import { toast } from 'sonner';
import {
  Calendar,
  RefreshCw,
  FileText,
  Printer,
  Loader2,
  Users,
  Clock,
  AlertCircle,
  Plus,
  GripVertical,
  Save,
  X,
  RotateCcw
} from 'lucide-react';

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface DragItem {
  scheduleId: string;
  sourceDay: number;
  sourceIndex: number;
}

// ───────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={32} className="text-slate-400 animate-spin" />
      <p className="text-sm text-slate-500">Carregando escalas...</p>
    </div>
  );
}

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Users size={24} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        Nenhuma escala encontrada
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Gere automaticamente a escala de trabalho com base nos colaboradores cadastrados.
      </p>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {isGenerating ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Plus size={16} />
        )}
        {isGenerating ? 'Gerando...' : 'Gerar Escala Automática'}
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        Erro ao carregar dados
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Não foi possível carregar as escalas. Tente novamente.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
      >
        <RefreshCw size={16} />
        Tentar novamente
      </button>
    </div>
  );
}

function EditModeBanner({
  hasChanges,
  onSave,
  onCancel,
  isSaving
}: {
  hasChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-blue-800">
        <GripVertical size={16} />
        <span className="font-medium">
          Modo edição: arraste os turnos para ajustar manualmente
        </span>
      </div>
      <div className="flex items-center gap-2">
        {hasChanges && (
          <span className="text-xs text-blue-600 font-medium">
            Alterações pendentes
          </span>
        )}
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
        >
          <RotateCcw size={14} />
          Descartar
        </button>
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────

export default function EscalasPage() {
  const [data, setData] = useState<ScaleData | null>(null);
  const [originalData, setOriginalData] = useState<ScaleData | null>(null); // Backup para reset
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const scaleData = await fetchScales(new Date().getMonth() + 1, new Date().getFullYear());
      setData(scaleData);
      setOriginalData(JSON.parse(JSON.stringify(scaleData))); // Deep copy para backup
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading scale data:', err);
      setError('Falha ao carregar dados da escala');
      toast.error('Erro ao carregar dados da escala');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Drag & Drop Handlers ───

  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetDay: number, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || !data) return;

    // Evitar drop no mesmo lugar
    if (draggedItem.sourceDay === targetDay && draggedItem.sourceIndex === targetIndex) return;

    // Criar nova cópia dos dados com o item movido
    const newData = JSON.parse(JSON.stringify(data)) as ScaleData;
    const sourceDay = newData.days[draggedItem.sourceDay];
    const targetDayData = newData.days[targetDay];

    if (!sourceDay || !targetDayData) return;

    // Remover do source
    const [movedItem] = sourceDay.schedules.splice(draggedItem.sourceIndex, 1);
    
    // Inserir no target
    targetDayData.schedules.splice(targetIndex, 0, movedItem);

    setData(newData);
    setHasChanges(true);
  }, [draggedItem, data]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!data) return;

    setIsSaving(true);
    try {
      // Aqui precisaríamos de uma função para salvar a escala inteira
      // Como updateSchedule no service atualmente só salva observações,
      // vamos assumir que precisamos de uma função de saveScale
      toast.error('Funcionalidade de salvar escala completa ainda não implementada no Supabase');
    } catch (err) {
      console.error('Error saving changes:', err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  const handleDiscardChanges = useCallback(() => {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
    }
    setHasChanges(false);
    setIsEditMode(false);
    setDraggedItem(null);
    toast.info('Alterações descartadas');
  }, [originalData]);

  // ─── Action Handlers ───

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      await generateSchedules(new Date().getMonth() + 1, new Date().getFullYear());
      toast.success('Escala gerada automaticamente com sucesso!');
      await loadData();
    } catch (err) {
      console.error('Error generating scale:', err);
      toast.error('Erro ao gerar escala automática');
    } finally {
      setIsGenerating(false);
    }
  }, [loadData]);

  const handleExportPdf = useCallback(async () => {
    try {
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/escalas/export/pdf`, '_blank');
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      toast.error('Erro ao exportar PDF');
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const toggleEditMode = useCallback(() => {
    if (isEditMode && hasChanges) {
      // Confirmar antes de sair com alterações pendentes
      if (!confirm('Você tem alterações não salvas. Deseja sair do modo edição?')) {
        return;
      }
      handleDiscardChanges();
    } else {
      setIsEditMode(prev => !prev);
    }
  }, [isEditMode, hasChanges, handleDiscardChanges]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            Auxiliador de Escalas
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie a jornada de trabalho dos colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          {data && (
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isEditMode
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GripVertical size={16} />
              {isEditMode ? 'Sair Edição' : 'Editar Manual'}
            </button>
          )}

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Imprimir escala"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Exportar PDF"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          {/* Primary Action */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {isGenerating ? 'Gerando...' : 'Gerar Escala'}
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <EditModeBanner
          hasChanges={hasChanges}
          onSave={handleSaveChanges}
          onCancel={handleDiscardChanges}
          isSaving={isSaving}
        />
      )}

      {/* Info Bar */}
      {lastUpdated && data && !isEditMode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
          <Clock size={14} />
          <span>
            Última atualização: {lastUpdated.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={loadData} />
        ) : !data ? (
          <EmptyState onGenerate={handleGenerate} isGenerating={isGenerating} />
        ) : (
          <div className="p-4">
            <ScaleMatrix
              userId="system"
              tenantId="system"
              data={data}
              onRefresh={loadData}
              isEditMode={isEditMode}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              draggedItem={draggedItem}
            />
          </div>
        )}
      </div>
    </div>
  );
}