import { useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { ClienteAdministrativo } from '../types';
import {
  getClienteAdministrativoPinColor,
} from '../utils/clienteAdministrativoPinColor';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

interface ClienteAdministrativoPDFViewerProps {
  pdfPath: string | null;
  clientes: ClienteAdministrativo[];
  onAddMark: (x: number, y: number, page: number) => void;
  onMarkClick: (cliente: ClienteAdministrativo) => void;
  onMarkMove?: (cliente: ClienteAdministrativo, coordenadas: { x: number; y: number; page: number }) => void;
  selectedCliente?: ClienteAdministrativo | null;
  allowCreateMarks?: boolean;
}

const DRAG_THRESHOLD_PX = 4;

export default function ClienteAdministrativoPDFViewer({
  pdfPath,
  clientes,
  onAddMark,
  onMarkClick,
  onMarkMove,
  selectedCliente,
  allowCreateMarks = true,
}: ClienteAdministrativoPDFViewerProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [dragPreview, setDragPreview] = useState<{ clienteId: string; x: number; y: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragSessionRef = useRef<{ clienteId: string; moved: boolean } | null>(null);
  const skipOverlayClickRef = useRef(false);
  const clientesRef = useRef(clientes);
  const onMarkClickRef = useRef(onMarkClick);
  const onMarkMoveRef = useRef(onMarkMove);

  clientesRef.current = clientes;
  onMarkClickRef.current = onMarkClick;
  onMarkMoveRef.current = onMarkMove;

  const getCoordsFromClientPoint = useCallback((clientX: number, clientY: number) => {
    if (!overlayRef.current) return null;
    const rect = overlayRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y, page: currentPage };
  }, [currentPage]);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      setPageWidth(Math.min(containerWidth - 32, 1200));
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
  };

  useEffect(() => {
    if (!dragActive || !allowCreateMarks) return;

    const handleMouseMove = (event: MouseEvent) => {
      const start = dragPointerStartRef.current;
      if (start) {
        const hasMoved =
          Math.hypot(event.clientX - start.x, event.clientY - start.y) >= DRAG_THRESHOLD_PX;
        if (hasMoved && dragSessionRef.current) {
          dragSessionRef.current.moved = true;
        }
      }

      const coords = getCoordsFromClientPoint(event.clientX, event.clientY);
      if (!coords || !dragSessionRef.current) return;

      setDragPreview({
        clienteId: dragSessionRef.current.clienteId,
        x: coords.x,
        y: coords.y,
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      const session = dragSessionRef.current;
      dragSessionRef.current = null;
      dragPointerStartRef.current = null;
      setDragPreview(null);
      setDragActive(false);
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');

      if (!session) return;

      const cliente = clientesRef.current.find((c) => c.id === session.clienteId);
      if (!cliente) return;

      if (session.moved) {
        skipOverlayClickRef.current = true;
        const coords = getCoordsFromClientPoint(event.clientX, event.clientY);
        if (coords) {
          onMarkMoveRef.current?.(cliente, coords);
        }
        return;
      }

      onMarkClickRef.current(cliente);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');
    };
  }, [allowCreateMarks, dragActive, getCoordsFromClientPoint]);

  const handlePinMouseDown = useCallback(
    (event: React.MouseEvent, cliente: ClienteAdministrativo) => {
      event.stopPropagation();
      if (!allowCreateMarks) return;

      dragPointerStartRef.current = { x: event.clientX, y: event.clientY };
      dragSessionRef.current = { clienteId: cliente.id, moved: false };
      setDragPreview({
        clienteId: cliente.id,
        x: cliente.coordenadas.x,
        y: cliente.coordenadas.y,
      });
      setDragActive(true);
    },
    [allowCreateMarks]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (skipOverlayClickRef.current) {
        skipOverlayClickRef.current = false;
        return;
      }
      if (dragActive) return;
      if (!overlayRef.current) return;

      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      const clicked = clientes.find((c) => {
        if (c.coordenadas.page !== currentPage) return false;
        const distance = Math.sqrt(
          Math.pow(x - c.coordenadas.x, 2) + Math.pow(y - c.coordenadas.y, 2)
        );
        return distance < 1.5;
      });

      if (clicked) {
        onMarkClick(clicked);
      } else if (allowCreateMarks) {
        onAddMark(x, y, currentPage);
      }
    },
    [clientes, currentPage, dragActive, onAddMark, onMarkClick, allowCreateMarks]
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

      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200">
        <div className="p-4 min-w-full w-max flex justify-center">
          <div className="relative inline-block shrink-0">
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
                    const isDragging = dragPreview?.clienteId === cliente.id;
                    const displayX = isDragging ? dragPreview.x : cliente.coordenadas.x;
                    const displayY = isDragging ? dragPreview.y : cliente.coordenadas.y;
                    const nome = (cliente.nomeCliente || '').trim() || 'Sem cliente';
                    const box = (cliente.box || '').trim() || '—';
                    const corredor = (cliente.corredor || '').trim() || '—';

                    return (
                      <div
                        key={cliente.id}
                        onMouseDown={(e) => handlePinMouseDown(e, cliente)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allowCreateMarks) return;
                          onMarkClick(cliente);
                        }}
                        className={`group absolute flex items-center justify-center w-5 h-5 z-10 hover:z-50 ${
                          allowCreateMarks ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${isDragging ? 'z-50' : ''} ${isSelected ? 'z-40' : ''}`}
                        style={{
                          left: `${displayX}%`,
                          top: `${displayY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full shadow-md ring-1 ring-white/80 transition-transform ${
                            isDragging ? 'scale-150' : 'group-hover:scale-150'
                          } ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                        {!isDragging && (
                          <div className="pointer-events-none absolute left-1/2 bottom-full mb-1 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <div className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg whitespace-nowrap">
                              <p className="font-semibold">{nome}</p>
                              <p className="text-gray-300">
                                Box {box} · Corredor {corredor}
                              </p>
                            </div>
                          </div>
                        )}
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
