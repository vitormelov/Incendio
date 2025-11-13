import { useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Incendio } from '../types';
import { getDisciplinaColor } from '../utils/colors';

// Configurar o worker do PDF.js usando a versão exata que o react-pdf usa
// O react-pdf usa pdfjs versão 5.4.296 internamente
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

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
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ajustar a largura da página baseada no container
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      setPageWidth(Math.min(containerWidth - 32, 1200)); // 32px de padding
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setPdfLoaded(true);
  };

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
        <div className="flex justify-center items-start">
          <div className="relative inline-block">
            <Document
              file={pdfPath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('Erro ao carregar PDF:', error);
                setPdfLoaded(true);
              }}
              loading={
                <div className="flex items-center justify-center min-h-[800px]">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600">Carregando PDF...</p>
                  </div>
                </div>
              }
            >
              <div ref={pageRef} className="relative">
                <Page
                  pageNumber={currentPage}
                  width={pageWidth * scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                  loading={
                    <div className="flex items-center justify-center min-h-[600px] w-full bg-white">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <p className="text-gray-600 text-sm">Carregando página...</p>
                      </div>
                    </div>
                  }
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
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}
