import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

const InvoicePreviewModal = ({ isOpen, onClose, orderId }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const pdfUrlRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const generateInvoice = useCallback(async () => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = '';
    }
    setLoading(true);
    setError('');
    try {
      const invoiceUrl = `${API_BASE_URL}/orders/${orderId}/invoice`;
      const response = await fetch(invoiceUrl, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('aurea_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice (HTTP error)');
      }

      const contentType = response.headers.get('Content-Type') || response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error(`Invalid content-type for invoice: ${contentType}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Impossible de générer la facture');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      generateInvoice();
    }
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = '';
      }
    };
  }, [isOpen, orderId, generateInvoice]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice?download=true`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('aurea_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `facture_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Impossible de générer la facture');
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Error printing invoice:', e);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Aperçu de la Facture</h2>
          <div className="flex items-center space-x-4">
            {!loading && !error && (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-[linear-gradient(135deg,_#5B58EB,_#09fbff)] text-white rounded-md hover:bg-blue-700 transition"
                >
                  <Download size={18} />
                  <span>Télécharger PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  <Printer size={18} />
                  <span>Imprimer</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content containing the PDF Preview */}
        <div className="flex-1 bg-gray-100 p-4 relative flex justify-center items-center">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 size={48} className="text-[#56E1E9] animate-spin" />
              <p className="text-gray-500 font-medium">Génération de la facture en cours...</p>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 bg-red-50 px-6 py-4 rounded-md border border-red-200">
              <p className="font-semibold">{error}</p>
              <button 
                onClick={generateInvoice}
                className="mt-4 text-[#56E1E9] hover:underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full bg-white shadow-sm rounded border border-gray-300"
              title="Invoice Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
