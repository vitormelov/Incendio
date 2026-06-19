import { useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { ClienteAdministrativo } from '../types';
import {
  getClienteAdministrativoPinColor,
  getClienteAdministrativoPinLabel,
} from '../utils/clienteAdministrativoPinColor';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

interface ClienteAdministrativoPDFViewerProps {
  pdfPath: string | null;
  clientes: ClienteAdministrativo[];
  onAddMark: (x: number, y: number, page: number) => void;
  onMarkClick: (cliente: ClienteAdministrativo) => void;
  selectedCliente?: ClienteAdministrativo | null;
  allowCreateMarks?: boolean;
}

export default function ClienteAdministrativoPDFViewer({
  pdfPath,
  clientes,
  onAddMark,
  onMarkClick,
  selectedCliente,
  allowCreateMarks = true,
}: ClienteAdministrativoPDFViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      setPageWidth(Math.min(containerWidth - 32, 1200));
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
  };

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!overlayRef.current) return;

      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      const clicked = clientes.find((c) => {
        if (c.coordenadas.page !== currentPage) return false;
        const distance = Math.sqrt(
          Math.pow(x - c.coordenadas.x, 2) + Math.pow(y - c.coordenadas.y, 2)
        );
        return distance < 2;
      });

      if (clicked) {
        onMarkClick(clicked);
      } else if (allowCreateMarks) {
        onAddMark(x, y, currentPage);
      }
    },
    [clientes, currentPage, onAddMark, onMarkClick, allowCreateMarks]
  );

  const currentPageClientes = clientes.filter((c) => c.coordenadas.page === currentPage);

  if (!pdfPath) {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">PDF não disponível</p>
            <p className="text-gray-600">Este setor ainda não possui uma planta/PDF associado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 flex items-center gap-1"
          >
            <span>Próxima</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.5))}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Diminuir zoom"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(prev + 0.2, 3.0))}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Aumentar zoom"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-4 relative">
        <div className="flex justify-center items-start">
          <div className="relative inline-block">
            <Document
              file={pdfPath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error('Erro ao carregar PDF:', error)}
              loading={
                <div className="flex items-center justify-center min-h-[800px]">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
                    <p className="text-gray-600">Carregando PDF...</p>
                  </div>
                </div>
              }
            >
              <div className="relative">
                <Page
                  pageNumber={currentPage}
                  width={pageWidth * scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />

                <div
                  ref={overlayRef}
                  className="absolute inset-0 cursor-crosshair"
                  onClick={handleOverlayClick}
                >
                  {currentPageClientes.map((cliente) => {
                    const color = getClienteAdministrativoPinColor(cliente);
                    const isSelected = selectedCliente?.id === cliente.id;
                    const label = getClienteAdministrativoPinLabel(cliente);
                    const nome = (cliente.nomeCliente || '').trim() || 'Sem cliente';

                    return (
                      <div
                        key={cliente.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkClick(cliente);
                        }}
                        className="absolute cursor-pointer transition-all hover:scale-125 z-10"
                        style={{
                          left: `${cliente.coordenadas.x}%`,
                          top: `${cliente.coordenadas.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={`${nome} — Box ${cliente.box || '—'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                            isSelected ? 'ring-4 ring-blue-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {label}
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
