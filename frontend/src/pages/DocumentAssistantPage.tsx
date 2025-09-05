// src/pages/DocumentAssistantPage.tsx

import React, { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { type PolicyDocument } from '../api/types'; // We'll need to add this type
import { Upload, Trash2, FileText } from 'lucide-react';
import './DocumentAssistantPage.css';

const DocumentAssistantPage: React.FC = () => {
    const [documents, setDocuments] = useState<PolicyDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State for the upload form
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const api = useApi();

    // Function to fetch documents from the backend
    const fetchDocuments = useCallback(async () => {
        try {
            const response = await api.get('/documents/');
            setDocuments(response.data);
        } catch (err) {
            console.error("Failed to fetch documents:", err);
            setError('Could not load documents. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Fetch documents on initial component load
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] || null);
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !title.trim()) {
            setError('Please provide a title and select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('file', selectedFile);

        try {
            await api.post('/documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Reset form and refetch the list on success
            setTitle('');
            setSelectedFile(null);
            await fetchDocuments();
        } catch (err) {
            console.error("Upload failed:", err);
            setError('File upload failed. Please ensure it is a valid PDF or TXT file.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (docId: number) => {
        if (window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
            try {
                await api.delete(`/documents/${docId}/`);
                // Refetch the list to reflect the deletion
                await fetchDocuments();
            } catch (err) {
                console.error("Delete failed:", err);
                setError('Failed to delete the document.');
            }
        }
    };

    return (
        <div className="document-assistant-page">
            <Link to="/admin/dashboard" className="back-link">&larr; Back to Dashboard</Link>
            <header>
                <h1>Intelligent Document Assistant</h1>
                <p>Upload and manage documents (e.g., policies, guides) to power your AI chatbot's knowledge base.</p>
            </header>

            {/* --- Upload Form Section --- */}
            <section className="upload-section widget">
                <h2>Upload New Document</h2>
                <form onSubmit={handleUpload}>
                    <div className="form-group">
                        <label htmlFor="title">Document Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Returns & Refund Policy"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="file">Document File (PDF or TXT)</label>
                        <input
                            id="file"
                            type="file"
                            accept=".pdf,.txt"
                            onChange={handleFileChange}
                            required
                        />
                    </div>
                    <button type="submit" disabled={isUploading}>
                        <Upload size={18} />
                        {isUploading ? 'Uploading...' : 'Upload & Index Document'}
                    </button>
                </form>
            </section>

            {error && <p className="error-message">{error}</p>}

            {/* --- Document List Section --- */}
            <section className="document-list-section widget">
                <h2>Managed Documents</h2>
                {loading ? (
                    <p>Loading documents...</p>
                ) : documents.length > 0 ? (
                    <ul className="document-list">
                        {documents.map(doc => (
                            <li key={doc.id}>
                                <FileText className="file-icon" />
                                <div className="doc-info">
                                    <span className="doc-title">{doc.title}</span>
                                    <span className="doc-meta">
                                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <button onClick={() => handleDelete(doc.id)} className="delete-btn">
                                    <Trash2 />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No documents uploaded yet. Use the form above to get started.</p>
                )}
            </section>
        </div>
    );
};

export default DocumentAssistantPage;