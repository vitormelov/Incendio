import { useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Incendio } from '../types';
import { getDisciplinaColor } from '../utils/colors';

interface PDFViewerProps {
  pdfPath: string;
  incendios: Incendio[];
  onAddMark: (x: number, y: number, page: number) => void;
  onMarkClick: (incendio: Incendio) => void;
  selectedIncendio?: Incendio | null;
}

export default function PDFViewer({ 
  pdfPath, 
  incendios, 
  onAddMark, 
  onMarkClick,
  selectedIncendio 
}: PDFViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Tentar detectar o número de páginas do PDF
    // Isso pode não funcionar perfeitamente, mas vamos assumir 1 página por padrão
    setTotalPages(1);
    setPdfLoaded(true);
  }, [pdfPath]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Verificar se clicou em uma marcação existente
    const clickedIncendio = incendios.find(inc => {
      if (inc.coordenadas.page !== currentPage) return false;
      const markX = inc.coordenadas.x;
      const markY = inc.coordenadas.y;
      const distance = Math.sqrt(Math.pow(x - markX, 2) + Math.pow(y - markY, 2));
      return distance < 2; // 2% de tolerância
    });

    if (clickedIncendio) {
      onMarkClick(clickedIncendio);
    } else {
      onAddMark(x, y, currentPage);
    }
  }, [incendios, currentPage, onAddMark, onMarkClick]);

  const currentPageIncendios = incendios.filter(i => i.coordenadas.page === currentPage);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Controles */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <span className="text-sm font-medium px-2">
            Página {currentPage} {totalPages > 1 ? `de ${totalPages}` : ''}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 flex items-center gap-1"
          >
            <span>Próxima</span>
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Diminuir zoom"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Aumentar zoom"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* Visualizador de PDF */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-200 p-4 relative"
      >
        <div 
          className="relative inline-block"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${100 / scale}%`,
          }}
        >
          {/* Iframe com PDF */}
          <iframe
            ref={iframeRef}
            src={`${pdfPath}#page=${currentPage}&zoom=page-width`}
            className="w-full border shadow-lg bg-white"
            style={{
              minHeight: '800px',
              height: 'auto',
            }}
            title="PDF Viewer"
            onLoad={() => setPdfLoaded(true)}
          />

          {/* Overlay para marcações e cliques */}
          <div
            ref={overlayRef}
            className="absolute inset-0 cursor-crosshair"
            onClick={handleOverlayClick}
            style={{
              pointerEvents: 'auto',
            }}
          >
            {/* Marcações */}
            {currentPageIncendios.map((incendio) => {
              const color = getDisciplinaColor(incendio.disciplina);
              const isSelected = selectedIncendio?.id === incendio.id;
              
              return (
                <div
                  key={incendio.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkClick(incendio);
                  }}
                  className="absolute cursor-pointer transition-all hover:scale-125 z-10"
                  style={{
                    left: `${incendio.coordenadas.x}%`,
                    top: `${incendio.coordenadas.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${incendio.descricao} - ${incendio.responsavel}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                      isSelected ? 'ring-4 ring-blue-400' : ''
                    }`}
                    style={{
                      backgroundColor: color,
                      border: incendio.isGargalo ? '3px solid #000' : 'none',
                    }}
                  >
                    {incendio.severidade}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!pdfLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Carregando PDF...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
